import { createServerFn } from "@tanstack/react-start";

export interface CreateCashfreeOrderPayload {
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl?: string;
}

export interface CashfreeOrderResult {
  success: boolean;
  paymentSessionId?: string;
  cfOrderId?: string;
  orderId?: string;
  error?: string;
}

export interface VerifyCashfreeOrderResult {
  success: boolean;
  orderStatus?: string;
  paymentStatus?: "Paid" | "Pending" | "Failed";
  cfOrderId?: string;
  orderId?: string;
  error?: string;
  paymentTxnId?: string;
  paymentModeDetails?: string;
}

function getBaseUrl(): string {
  const env =
    process.env.CASHFREE_ENV ||
    (import.meta as any).env?.CASHFREE_ENV ||
    "sandbox";
  return env === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function getHeaders(): Record<string, string> {
  const appId =
    process.env.CASHFREE_APP_ID ||
    (import.meta as any).env?.CASHFREE_APP_ID ||
    "";
  const secretKey =
    process.env.CASHFREE_SECRET_KEY ||
    (import.meta as any).env?.CASHFREE_SECRET_KEY ||
    "";
  const apiVersion =
    process.env.CASHFREE_API_VERSION ||
    (import.meta as any).env?.CASHFREE_API_VERSION ||
    "2023-08-01";

  if (!appId || !secretKey) {
    throw new Error(
      "[Cashfree] CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not set in environment variables. Please add them to your .env file."
    );
  }

  return {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": apiVersion,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export const createCashfreeOrderFn = createServerFn({ method: "POST" })
  .validator((data: CreateCashfreeOrderPayload) => data)
  .handler(async ({ data }): Promise<CashfreeOrderResult> => {
    try {
      const baseUrl = getBaseUrl();
      const headers = getHeaders();
      
      console.log(
        "[Cashfree PG Debug] Connecting to:", baseUrl,
        "| AppID prefix:", headers["x-client-id"]?.substring(0, 8),
        "| SecretKey prefix:", headers["x-client-secret"]?.substring(0, 8)
      );

      // Clean phone number: remove non-digits, default to 10 digits
      const sanitizedPhone =
        data.customerPhone.replace(/[^\d]/g, "").slice(-10) || "9999999999";

      // Clean email or provide valid fallback
      const sanitizedEmail =
        data.customerEmail && data.customerEmail.includes("@")
          ? data.customerEmail
          : "customer@thakuryograj.com";

      const orderId = `ORD_CF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const customerId = `CUST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const requestBody = {
        order_id: orderId,
        order_amount: data.orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: customerId,
          customer_name: data.customerName || "Valued Customer",
          customer_email: sanitizedEmail,
          customer_phone: sanitizedPhone,
        },
        order_meta: {
          return_url: data.returnUrl
            ? (data.returnUrl.includes("{order_id}") ? data.returnUrl : `${data.returnUrl}?order_id={order_id}`)
            : "https://www.cashfree.com/devstudio/preview/pg/web/popup",
        },
      };

      const response = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Cashfree create order API error:", responseData);
        return {
          success: false,
          error:
            responseData.message ||
            responseData.error ||
            "Failed to initialize Cashfree payment order.",
        };
      }

      return {
        success: true,
        paymentSessionId: responseData.payment_session_id,
        cfOrderId: String(responseData.cf_order_id || responseData.order_id),
        orderId: responseData.order_id,
      };
    } catch (err: any) {
      console.error("Cashfree create order exception:", err);
      return {
        success: false,
        error: err?.message || "Internal server error connecting to Cashfree.",
      };
    }
  });

export const verifyCashfreeOrderFn = createServerFn({ method: "POST" })
  .validator((data: { orderId: string }) => data)
  .handler(async ({ data }): Promise<VerifyCashfreeOrderResult> => {
    try {
      const baseUrl = getBaseUrl();
      const headers = getHeaders();

      const response = await fetch(`${baseUrl}/orders/${data.orderId}`, {
        method: "GET",
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Cashfree verify order API error:", responseData);
        return {
          success: false,
          error: responseData.message || "Failed to verify order status with Cashfree.",
        };
      }

      const orderStatus = responseData.order_status;
      const isPaid = orderStatus === "PAID";

      let paymentTxnId = "";
      let paymentModeDetails = "";

      try {
        const paymentsResponse = await fetch(`${baseUrl}/orders/${data.orderId}/payments`, {
          method: "GET",
          headers,
        });
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          if (Array.isArray(paymentsData) && paymentsData.length > 0) {
            const successfulPayment = paymentsData.find(p => p.payment_status === "SUCCESS") || paymentsData[0];
            paymentTxnId = String(successfulPayment.cf_payment_id || "");
            
            const method = successfulPayment.payment_method;
            if (method) {
              if (method.upi) {
                paymentModeDetails = `UPI (${method.upi.upi_id || "UPI Pay"})`;
              } else if (method.netbanking) {
                paymentModeDetails = `Netbanking (Bank: ${method.netbanking.bank_code || "Online"})`;
              } else if (method.card) {
                paymentModeDetails = `Card (${method.card.card_network} ${method.card.card_type} ****${method.card.card_number?.slice(-4) || ""})`;
              } else {
                paymentModeDetails = Object.keys(method)[0]?.toUpperCase() || "Online";
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch detailed payment info from Cashfree:", err);
      }

      return {
        success: true,
        orderStatus,
        paymentStatus: isPaid ? "Paid" : orderStatus === "FAILED" ? "Failed" : "Pending",
        cfOrderId: String(responseData.cf_order_id || responseData.order_id),
        orderId: responseData.order_id,
        paymentTxnId,
        paymentModeDetails,
      };
    } catch (err: any) {
      console.error("Cashfree verify order exception:", err);
      return {
        success: false,
        error: err?.message || "Failed to connect to Cashfree for verification.",
      };
    }
  });
