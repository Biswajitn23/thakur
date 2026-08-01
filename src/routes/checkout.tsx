import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import brandLogo from "@/assets/logo.png";
import { useAuth } from "@/lib/auth-context";
import { useOrders } from "@/hooks/use-orders";
import { useCoupons } from "@/hooks/use-coupons";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { createCashfreeOrderFn, verifyCashfreeOrderFn } from "@/lib/cashfree-server";
import { getCashfreeInstance } from "@/lib/cashfree";
import { useCartContext } from "@/context/cart-context";
import { sendNtfyNotification } from "@/lib/ntfy";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Truck,
  CreditCard,
  ShoppingBag,
  Tag,
  AlertCircle,
  Sparkles,
  Minus,
  Plus,
  Trash2,
  MapPin,
  Leaf,
  RotateCcw,
  BadgeCheck,
  Search,
  Package,
} from "lucide-react";

function QuantityInput({ value, onChange }: { value: number; onChange: (qty: number) => void }) {
  const [localVal, setLocalVal] = useState(value.toString());

  useEffect(() => {
    setLocalVal(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.replace(/[^\d]/g, "");
    setLocalVal(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localVal, 10);
    if (isNaN(parsed) || parsed < 1) {
      onChange(1);
      setLocalVal("1");
    }
  };

  const handleDecrement = () => {
    const parsed = parseInt(localVal, 10);
    if (!isNaN(parsed) && parsed > 1) {
      onChange(parsed - 1);
      setLocalVal((parsed - 1).toString());
    } else {
      onChange(1);
      setLocalVal("1");
    }
  };

  const handleIncrement = () => {
    const parsed = parseInt(localVal, 10);
    const current = isNaN(parsed) ? 1 : parsed;
    onChange(current + 1);
    setLocalVal((current + 1).toString());
  };

  return (
    <div className="flex items-center border border-stone-200 bg-white rounded-xl overflow-hidden shadow-sm h-8 shrink-0">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= 1}
        className="w-8 h-full flex items-center justify-center font-bold text-base text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none select-none"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-10 text-center text-xs font-bold text-stone-950 bg-transparent border-none outline-none focus:ring-0 focus:outline-none p-0 select-all font-mono"
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="w-8 h-full flex items-center justify-center font-bold text-base text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition cursor-pointer select-none"
      >
        +
      </button>
    </div>
  );
}

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Thakur Yograj" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FullCheckoutPage,
});

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) { // 0 = Sunday, 6 = Saturday
      added++;
    }
  }
  return result;
}

function getDeliveryRange(): string {
  const now = new Date();
  const d1 = addBusinessDays(now, 5);
  const d2 = addBusinessDays(now, 7);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (d1.getMonth() === d2.getMonth()) {
    return `${months[d1.getMonth()]} ${d1.getDate()}\u2013${d2.getDate()}`;
  }
  return `${months[d1.getMonth()]} ${d1.getDate()} \u2013 ${months[d2.getMonth()]} ${d2.getDate()}`;
}

function FullCheckoutPage() {
  const { items, removeItem, setQty, subtotal, clearCart, appliedCoupon, setAppliedCoupon } = useCartContext();
  const { createOrder, updateOrderPayment, orders, loading: ordersLoading } = useOrders();
  const { coupons, incrementCouponUsedCount } = useCoupons();
  const { settings: storeSettings } = useStoreSettings();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cashfree" | "COD">("Cashfree");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVerifyingURLPayment, setIsVerifyingURLPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const [successOrderDetails, setSuccessOrderDetails] = useState<{
    items: any[];
    subtotal: number;
    shippingAddress: string;
    customerName: string;
    customerPhone: string;
    paymentMethod: string;
    finalTotal: number;
    appliedCoupon: any;
    discountAmount: number;
    shippingFee: number;
  } | null>(null);

  const getWhatsAppOrderUrl = () => {
    const itemsText = items.map(i => `${i.name} (Qty: ${i.qty})`).join(", ");
    const text = `Hello Thakur Yograj Ayurveda, I would like to place an order:
- *Items*: ${itemsText}
- *Total*: ₹${finalTotal}
- *Name*: ${customerName}
- *Phone*: ${customerPhone}
- *Address*: ${shippingAddress}
${orderNote ? `- *Note*: ${orderNote}` : ""}

Please confirm my order and share payment details/QR code.`;
    return `https://wa.me/918959568262?text=${encodeURIComponent(text)}`;
  };

  // Promo Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");

  // Confetti effect on order success
  useEffect(() => {
    if (orderSuccess) {
      let timeoutId: NodeJS.Timeout;
      let animationFrameId: number;

      import("canvas-confetti").then((module) => {
        const confetti = module.default;
        // First big burst
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        // Secondary delayed shots
        const end = Date.now() + 1500;
        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });

          if (Date.now() < end) {
            animationFrameId = requestAnimationFrame(frame);
          }
        };
        
        timeoutId = setTimeout(() => {
          animationFrameId = requestAnimationFrame(frame);
        }, 350);
      });

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }
  }, [orderSuccess]);

  // Auto pre-fill user info when logged in
  useEffect(() => {
    if (user) {
      if (!customerName && user.displayName) setCustomerName(user.displayName);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  // Verify Cashfree Payment when redirected back to this page with order_id in URL
  useEffect(() => {
    const checkURLPayment = async () => {
      if (typeof window === "undefined") return;
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdParam = urlParams.get("order_id");
      if (!orderIdParam || ordersLoading) return;

      console.log("[Checkout URL Verify] Processing URL payment verification for order:", orderIdParam);
      
      const localOrder = orders.find(o => o.paymentId === orderIdParam || o.cfOrderId === orderIdParam);
      
      if (!localOrder) {
        console.log("[Checkout URL Verify] Order not found in database yet. Waiting for sync...");
        return;
      }

      // If already marked as Paid, show success directly
      if (localOrder.paymentStatus === "Paid") {
        console.log("[Checkout URL Verify] Order is already Paid.");
        setSuccessOrderDetails({
          items: localOrder.items,
          subtotal: localOrder.total - (storeSettings.deliveryFee ?? 49),
          shippingAddress: localOrder.shippingAddress,
          customerName: localOrder.customerName,
          customerPhone: localOrder.customerPhone,
          paymentMethod: "Cashfree",
          finalTotal: localOrder.total,
          appliedCoupon: null,
          discountAmount: 0,
          shippingFee: localOrder.total >= (storeSettings.freeShippingThreshold ?? 499) ? 0 : (storeSettings.deliveryFee ?? 49),
        });
        setPlacedOrderId(localOrder.id);
        setOrderSuccess(true);
        clearCart();
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      setIsVerifyingURLPayment(true);
      try {
        const verifyRes = await verifyCashfreeOrderFn({
          data: { orderId: orderIdParam },
        });

        const isPaid = verifyRes.paymentStatus === "Paid" || verifyRes.orderStatus === "PAID";
        console.log("[Checkout URL Verify] Verification response:", verifyRes);

        if (isPaid) {
          await updateOrderPayment(
            localOrder.id,
            "Paid",
            orderIdParam,
            verifyRes.paymentTxnId,
            verifyRes.paymentModeDetails
          );

          if (localOrder.couponCode) {
            await incrementCouponUsedCount(localOrder.couponCode);
          }

          sendNtfyNotification({
            title: "New Paid Order (Redirect Verified)! 💰",
            message: `Order ID: ${localOrder.id}\nCustomer: ${localOrder.customerName}\nPhone: ${localOrder.customerPhone}\nTotal Amount: ₹${localOrder.total}\nPayment Method: Cashfree\nTxn ID: ${verifyRes.paymentTxnId || "N/A"}\nItems: ${localOrder.items.map(i => `${i.name} (Qty: ${i.qty})`).join(", ")}`,
            priority: "high",
            tags: "shopping_bags,moneybag",
          });

          setSuccessOrderDetails({
            items: localOrder.items,
            subtotal: localOrder.total - (storeSettings.deliveryFee ?? 49) + (localOrder.discountAmount || 0),
            shippingAddress: localOrder.shippingAddress,
            customerName: localOrder.customerName,
            customerPhone: localOrder.customerPhone,
            paymentMethod: "Cashfree",
            finalTotal: localOrder.total,
            appliedCoupon: localOrder.couponCode ? { code: localOrder.couponCode, discountValue: localOrder.discountAmount || 0, discountType: "flat" } : null,
            discountAmount: localOrder.discountAmount || 0,
            shippingFee: localOrder.total >= (storeSettings.freeShippingThreshold ?? 499) ? 0 : (storeSettings.deliveryFee ?? 49),
          });
          setPlacedOrderId(localOrder.id);
          setOrderSuccess(true);
          clearCart();
          toast.success("Payment completed successfully!");
        } else {
          const errMsg = "Payment verification failed. Your payment was not completed or was cancelled.";
          setPaymentError(errMsg);
          toast.error(errMsg);
        }
      } catch (err: any) {
        console.error("[Checkout URL Verify] Error verifying payment:", err);
        const errMsg = "Error verifying payment: " + (err.message || "Unknown error");
        setPaymentError(errMsg);
        toast.error(errMsg);
      } finally {
        setIsVerifyingURLPayment(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkURLPayment();
  }, [ordersLoading, orders]);

  // Enforce COD availability setting
  useEffect(() => {
    if (!storeSettings.isCodEnabled && paymentMethod === "COD") {
      setPaymentMethod("Cashfree");
    }
  }, [storeSettings.isCodEnabled, paymentMethod]);

  // Calculate discount, delivery fee, GST and final payable total
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percent") {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const deliveryFeeConfig = storeSettings.deliveryFee ?? 49;
  const freeThresholdConfig = storeSettings.freeShippingThreshold ?? 499;
  const gstRate = storeSettings.gstPercentage ?? 18;
  const isGstIncluded = storeSettings.isGstIncluded ?? true;

  const shippingFee = subtotal >= freeThresholdConfig || subtotal === 0 ? 0 : deliveryFeeConfig;
  const taxableBase = Math.max(0, subtotal - discountAmount);

  const gstAmount = isGstIncluded
    ? Math.round(taxableBase - taxableBase / (1 + gstRate / 100))
    : Math.round((taxableBase * gstRate) / 100);

  const finalTotal = isGstIncluded
    ? Math.max(0, taxableBase + shippingFee)
    : Math.max(0, taxableBase + gstAmount + shippingFee);

  const deliveryRange = getDeliveryRange();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    const matched = coupons.find(
      (c) => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase() && c.isActive
    );

    if (matched) {
      if (matched.usedCount !== undefined && matched.usageLimit !== undefined && matched.usedCount >= matched.usageLimit) {
        toast.error(`This coupon code has reached its usage limit.`);
        return;
      }
      if (subtotal < matched.minOrderValue) {
        toast.error(`Minimum order amount for coupon ${matched.code} is ₹${matched.minOrderValue}.`);
        return;
      }
      setAppliedCoupon({
        code: matched.code,
        discountValue: matched.discountValue,
        discountType: matched.discountType,
      });
      toast.success(`Coupon "${matched.code}" applied successfully!`);
      setCouponCodeInput("");
    } else {
      toast.error("Invalid or expired coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success("Coupon removed.");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to place an order.");
      navigate({ to: "/login" });
      return;
    }

    setPaymentError(null);

    const cleanPhone = customerPhone.replace(/[^\d]/g, "");
    if (cleanPhone.length < 10) {
      const msg = "Please enter a valid 10-digit mobile phone number.";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }

    if (!shippingAddress || shippingAddress.trim().length < 10) {
      const msg = "Please enter a complete delivery address (street, city, state & 6-digit pincode).";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }

    const name = customerName.trim() || user.displayName || "Customer";
    const email = customerEmail.trim() || user.email || "customer@example.com";
    const phone = customerPhone.trim();
    const address = shippingAddress.trim();

    const orderPayloadItems = items.map((i) => ({
      name: i.name,
      price: i.price,
      qty: i.qty,
      img: i.img,
    }));

    if (paymentMethod === "COD") {
      const orderId = await createOrder({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: orderNote ? `${address}\nDelivery Note: ${orderNote}` : address,
        items: orderPayloadItems,
        total: finalTotal,
        paymentMethod: "COD",
        paymentStatus: "Pending",
        userId: user.uid,
        couponCode: appliedCoupon?.code || "",
        discountAmount: discountAmount || 0,
      });

      if (appliedCoupon) {
        await incrementCouponUsedCount(appliedCoupon.code);
      }

      sendNtfyNotification({
        title: "New COD Order Placed! 📦",
        message: `Order ID: ${orderId}\nCustomer: ${name}\nPhone: ${phone}\nTotal Amount: ₹${finalTotal}\nItems: ${orderPayloadItems.map(i => `${i.name} (Qty: ${i.qty})`).join(", ")}`,
        priority: "high",
        tags: "package,money_with_wings",
      });

      setSuccessOrderDetails({
        items: [...items],
        subtotal,
        shippingAddress: orderNote ? `${address}\nDelivery Note: ${orderNote}` : address,
        customerName: name,
        customerPhone: phone,
        paymentMethod: "COD",
        finalTotal,
        appliedCoupon: appliedCoupon ? { ...appliedCoupon } : null,
        discountAmount,
        shippingFee,
      });
      setPlacedOrderId(orderId);
      setOrderSuccess(true);
      clearCart();
      toast.success("Order placed successfully via Cash on Delivery!");
      return;
    }

    // Cashfree Online Payment Flow
    setIsProcessingPayment(true);
    try {
      const res = await createCashfreeOrderFn({
        data: {
          orderAmount: finalTotal,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          returnUrl: window.location.origin + "/checkout",
        },
      });

      if (!res.success || !res.paymentSessionId) {
        throw new Error(res.error || "Failed to initialize payment order with Cashfree.");
      }

      // 1. Create order in our database as Pending first
      const orderId = await createOrder({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: orderNote ? `${address}\nDelivery Note: ${orderNote}` : address,
        items: orderPayloadItems,
        total: finalTotal,
        paymentMethod: "Cashfree",
        paymentStatus: "Pending",
        cfOrderId: res.cfOrderId,
        paymentId: res.orderId,
        userId: user.uid,
        couponCode: appliedCoupon?.code || "",
        discountAmount: discountAmount || 0,
      });

      const cashfree = await getCashfreeInstance();
      if (!cashfree) {
        throw new Error("Unable to load Cashfree checkout SDK. Please try again.");
      }

      console.log("[Cashfree SDK] Initializing checkout with session ID:", res.paymentSessionId);

      // 2. Launch Cashfree Checkout Modal
      const checkoutResult = await cashfree.checkout({
        paymentSessionId: res.paymentSessionId,
        redirectTarget: "_modal",
      });

      // 3. Verify Order Status on Server with retry mechanism (up to 3 attempts, 1.5s delay)
      let verifyRes;
      let isPaid = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`[Cashfree Checkout] Verifying order status (attempt ${attempt})...`);
        verifyRes = await verifyCashfreeOrderFn({
          data: { orderId: res.orderId || res.cfOrderId || "" },
        });
        isPaid = verifyRes.paymentStatus === "Paid" || verifyRes.orderStatus === "PAID";
        if (isPaid) break;
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      if (isPaid && verifyRes) {
        // 4. Update the existing order to Paid
        await updateOrderPayment(orderId, "Paid", res.orderId, verifyRes.paymentTxnId, verifyRes.paymentModeDetails);

        if (appliedCoupon) {
          await incrementCouponUsedCount(appliedCoupon.code);
        }

        sendNtfyNotification({
          title: "New Paid Order Placed! 💰",
          message: `Order ID: ${orderId}\nCustomer: ${name}\nPhone: ${phone}\nTotal Amount: ₹${finalTotal}\nPayment Method: Cashfree\nTxn ID: ${verifyRes.paymentTxnId || "N/A"}\nItems: ${orderPayloadItems.map(i => `${i.name} (Qty: ${i.qty})`).join(", ")}`,
          priority: "high",
          tags: "shopping_bags,moneybag",
        });

        setSuccessOrderDetails({
          items: [...items],
          subtotal,
          shippingAddress: orderNote ? `${address}\nDelivery Note: ${orderNote}` : address,
          customerName: name,
          customerPhone: phone,
          paymentMethod: "Cashfree",
          finalTotal,
          appliedCoupon: appliedCoupon ? { ...appliedCoupon } : null,
          discountAmount,
          shippingFee,
        });
        setPlacedOrderId(orderId);
        setOrderSuccess(true);
        clearCart();
        toast.success("Payment completed successfully!");
      } else {
        if (checkoutResult?.error) {
          throw new Error(checkoutResult.error.message || "Payment cancelled or failed.");
        }
        throw new Error("Payment was not completed. Please try again or choose Cash on Delivery (COD).");
      }
    } catch (err: any) {
      console.error("Cashfree checkout error:", err);
      const errMsg = err?.message || "Payment could not be completed. Please try again.";
      setPaymentError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Verifying URL Payment Loader
  if (isVerifyingURLPayment) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-[#082a1c] font-sans antialiased">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-[#cfa860]/30 shadow-2xl space-y-6">
          <div className="w-16 h-16 border-4 border-[#082a1c] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-[#082a1c]">Verifying Payment...</h2>
          <p className="text-xs text-stone-600 leading-relaxed font-semibold">
            Please wait while we confirm your payment status with Cashfree. This will take just a moment.
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated screen
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-stone-900 font-sans">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-amber-900/20 shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full grid place-items-center mx-auto text-3xl">
            🔐
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#082a1c]">Login Required to Checkout</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Please log in or register your account so we can link your shipping address and order receipt to your verified account.
          </p>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="w-full py-4 bg-[#082a1c] hover:bg-stone-900 text-[#cfa860] font-bold text-xs uppercase tracking-[0.2em] rounded-full transition shadow-xl cursor-pointer"
          >
            Log In / Register Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#082a1c] font-sans antialiased">
      {/* Top Luxury Ayurvedic Navigation Bar */}
      <header className="bg-ivory/95 backdrop-blur-md border-b border-gold/25 sticky top-0 z-50 shadow-sm px-4 sm:px-6">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between">
          {/* Left: Back Link */}
          <div className="w-1/3 flex justify-start">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest/70 hover:text-gold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-gold" />
              <span className="hidden sm:inline">Store</span>
            </Link>
          </div>

          {/* Center: Brand Logo */}
          <div className="w-1/3 flex justify-center">
            <Link to="/">
              <img src={brandLogo} alt="Thakur Yograj" className="h-12 sm:h-14 w-auto drop-shadow-sm transition-all" />
            </Link>
          </div>

          {/* Right: Customer Profile Account Details */}
          <div className="w-1/3 flex justify-end">
            <div className="flex items-center gap-2 sm:gap-2.5 bg-forest/5 border border-gold/30 px-3 py-1 rounded-full shadow-inner max-w-full">
              <div className="w-7 h-7 rounded-full bg-forest text-gold font-bold text-xs grid place-items-center border border-gold/30 shadow-md shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="text-left hidden md:block">
                <div className="font-bold text-[11px] text-forest leading-tight truncate max-w-[120px]">
                  {user?.displayName || "Customer"}
                </div>
                <div className="text-[9px] text-forest/60 truncate max-w-[120px] font-mono leading-none mt-0.5">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps Subbar with CHECKOUT title */}
        <div className="border-t border-gold/15 py-2 px-4 sm:px-6 flex items-center justify-between bg-ivory/50">
          <span className="font-serif text-xl sm:text-2xl font-bold text-[#082a1c] tracking-tight leading-none">
            {orderSuccess ? "Order Confirmed" : "Checkout"}
          </span>
          <div className="flex items-center gap-3 text-[9px] tracking-[0.2em] text-forest/50 uppercase font-semibold">
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("open_cart_on_home", "1");
                navigate({ to: "/" });
              }}
              className="text-forest/70 font-semibold hover:text-gold transition cursor-pointer hover:underline underline-offset-4"
            >1. Bag</button>
            <span className="text-gold/60">•</span>
            <span className={!orderSuccess ? "text-gold font-bold underline underline-offset-4 decoration-2" : "text-forest/70"}>2. Payment</span>
            <span className="text-gold/60">•</span>
            <span className={orderSuccess ? "text-gold font-bold underline underline-offset-4 decoration-2" : ""}>3. Done</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      {orderSuccess ? (
        (() => {
          const displayDetails = successOrderDetails || {
            items: items.length > 0 ? items : [
              { name: "Traditional Herbal Hair Oil (100ml)", price: "₹299", img: "https://placehold.co/100x100?text=Hair+Oil", qty: 1 },
              { name: "Dard Nivarak Ayurvedic Pain Oil", price: "₹349", img: "https://placehold.co/100x100?text=Pain+Oil", qty: 2 }
            ],
            subtotal: subtotal || 997,
            shippingAddress: shippingAddress || "Flat 402, Block B, Silver Oak Apartments, Sector 45, Gurgaon, Haryana - 122003",
            customerName: customerName || "Anjali Sharma",
            customerPhone: customerPhone || "9876543210",
            paymentMethod: paymentMethod || "Cashfree",
            finalTotal: finalTotal || 1046,
            appliedCoupon: appliedCoupon || { code: "WELCOME10", discountValue: 10, discountType: "percent" },
            discountAmount: discountAmount || 99,
            shippingFee: shippingFee || 49,
          };
          return (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN (7 Cols): Confirmation & Customer Info */}
                <div className="lg:col-span-7 space-y-6 animate-fade-in-up">
                  {/* Success Confirmation Card */}
                  <div className="bg-white rounded-3xl p-6 border border-emerald-500/20 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full grid place-items-center shrink-0 shadow-inner animate-checkmark">
                        <BadgeCheck className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-emerald-750 uppercase font-bold tracking-wider block">Order Placed</span>
                        <h2 className="font-serif text-2xl font-bold text-[#082a1c]">Thank you, {displayDetails.customerName}!</h2>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3 text-left">
                      Your order has been confirmed and is being prepared for shipment. A receipt and shipment tracking details have been sent to <strong>{user?.email || customerEmail}</strong>.
                    </p>
                  </div>

                  {/* Customer Information Card (Shipping, Payment etc) */}
                  <div className="bg-white rounded-3xl p-6 border border-[#cfa860]/30 shadow-sm space-y-5">
                    <h3 className="font-serif text-sm font-bold text-[#082a1c] border-b border-stone-100 pb-2 uppercase tracking-wider text-left">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-stone-600">
                      {/* Shipping Address */}
                      <div className="space-y-1.5 text-left">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#cfa860]" /> Shipping Address</span>
                        <p className="font-semibold text-stone-850 leading-relaxed">{displayDetails.customerName}</p>
                        <p className="leading-relaxed">{displayDetails.shippingAddress}</p>
                        <p className="font-mono pt-1">📱 Phone: {displayDetails.customerPhone}</p>
                      </div>

                      {/* Payment & Shipping Method */}
                      <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <span className="font-bold text-stone-900 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-[#cfa860]" /> Payment Method</span>
                          <p className="leading-relaxed font-semibold text-stone-850">
                            {displayDetails.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "Online Payment (Cashfree)"}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-bold text-stone-900 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-[#cfa860]" /> Shipping Method</span>
                          <p className="leading-relaxed font-semibold text-stone-850">Standard Delivery (5–7 Business Days)</p>
                          <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 inline-block mt-1">
                            Est. Delivery: {deliveryRange}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Continue Shopping Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      to="/"
                      className="px-6 py-4 bg-[#082a1c] text-[#e5c178] hover:bg-stone-900 rounded-full font-bold text-xs uppercase tracking-widest transition shadow-lg text-center flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Continue Shopping
                    </Link>
                    <Link
                      to="/orders"
                      className="px-6 py-4 bg-white hover:bg-stone-50 text-[#082a1c] border border-stone-300 rounded-full font-bold text-xs uppercase tracking-widest transition text-center flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      View Order History
                    </Link>
                  </div>
                </div>

                {/* RIGHT COLUMN (5 Cols): Order Summary & Detailed Price Breakdown */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
                  <div className="bg-[#fdf8ee] rounded-[2rem] p-6 border-2 border-[#cfa860]/60 shadow-xl space-y-5">
                    <div className="flex items-center justify-between border-b border-[#cfa860]/30 pb-3">
                      <h3 className="font-serif text-lg font-bold text-[#082a1c] flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#cfa860]" /> Order Summary
                      </h3>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-[#082a1c] bg-[#cfa860]/25 px-2.5 py-0.5 rounded-full border border-[#cfa860]/50 font-sans tracking-wide inline-block">
                          Ref: {placedOrderId 
                            ? (placedOrderId.startsWith("ORD-") || placedOrderId.startsWith("TY-")
                                ? placedOrderId 
                                : `#${placedOrderId.slice(-6).toUpperCase()}`) 
                            : "#987654"}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {displayDetails.items.map((i, idx) => (
                        <div key={i.name + idx} className="flex gap-3 items-center bg-white/70 p-3 rounded-2xl border border-stone-200/80">
                          <img
                            src={i.img}
                            alt={i.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#cfa860]/20 shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left text-xs">
                            <div className="font-bold text-stone-900 truncate">{i.name}</div>
                            <div className="text-stone-500 mt-0.5 font-semibold font-mono">Qty: {i.qty}</div>
                          </div>
                          <div className="text-xs font-bold text-stone-900">{i.price}</div>
                        </div>
                      ))}
                    </div>

                    {/* Price Breakdown Details Box */}
                    <div className="p-4.5 rounded-2xl bg-[#082a1c]/5 border border-[#cfa860]/20 space-y-3 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Items Subtotal</span>
                        <span className="font-semibold text-stone-900 text-left">₹{displayDetails.subtotal.toLocaleString("en-IN")}</span>
                      </div>

                      {displayDetails.appliedCoupon && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Coupon Discount ({displayDetails.appliedCoupon.code})</span>
                          <span className="text-left">- ₹{displayDetails.discountAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-stone-600">
                        <span>Delivery Fee</span>
                        <span className={displayDetails.shippingFee === 0 ? "text-emerald-700 font-bold uppercase text-left" : "font-semibold text-stone-900 text-left"}>
                          {displayDetails.shippingFee === 0 ? "FREE" : `₹${displayDetails.shippingFee}`}
                        </span>
                      </div>

                      <div className="flex justify-between text-stone-950 font-bold border-t border-[#cfa860]/30 pt-3 text-sm">
                        <span>Total Paid Amount</span>
                        <span className="font-bold text-xl text-[#082a1c] text-left">
                          ₹{displayDetails.finalTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </main>
          );
        })()
      ) : items.length === 0 ? (
        <div className="max-w-md mx-auto my-20 px-6 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl grid place-items-center mx-auto text-3xl">
            🛍️
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#082a1c]">Your Shopping Bag is Empty</h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Explore our traditional botanical remedy collection to start your healing ritual.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-4 bg-[#082a1c] text-[#cfa860] rounded-full font-bold text-xs uppercase tracking-[0.2em] hover:bg-stone-900 transition shadow-xl"
          >
            Explore Remedy Collection
          </Link>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN (7 Cols): Account, Delivery Address & Payment */}
            <div className="lg:col-span-7 space-y-6">
              {/* Account Banner */}
              <div className="bg-white rounded-3xl p-6 border border-[#cfa860]/30 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-serif text-lg font-bold text-[#082a1c]">Verified Account Session</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-300">
                    Logged In
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-stone-900 text-sm">{user?.displayName || "Valued Customer"}</div>
                  <div className="text-stone-500">{user?.email}</div>
                </div>
              </div>

              {/* Form Component */}
              <form id="full-page-checkout-form" onSubmit={handleCheckout} className="space-y-6">
                {/* 1. Delivery Address Card */}
                <div className="bg-white rounded-3xl p-6 border border-[#cfa860]/30 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                    <Truck className="w-5 h-5 text-[#082a1c]" />
                    <h3 className="font-serif text-xl font-bold text-[#082a1c]">Shipping & Delivery Address</h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:outline-none focus:border-[#082a1c] transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:outline-none focus:border-[#082a1c] transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        10-Digit Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="[6-9][0-9]{9}"
                        title="Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9"
                        placeholder="10-Digit Mobile Number (e.g. 9876543210)"
                        value={customerPhone}
                        onChange={(e) => {
                          let digits = e.target.value.replace(/[^\d]/g, "");
                          if (digits.startsWith("91") && digits.length > 10) {
                            digits = digits.substring(2);
                          }
                          if (digits.startsWith("0")) {
                            digits = digits.substring(1);
                          }
                          setCustomerPhone(digits.slice(0, 10));
                        }}
                        className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:outline-none focus:border-[#082a1c] transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Full Shipping Address & Pincode
                      </label>
                      <textarea
                        required
                        rows={3}
                        minLength={10}
                        placeholder="House / Flat No., Building, Street Name, Landmark, City, State & 6-digit Pincode"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:outline-none focus:border-[#082a1c] transition leading-relaxed"
                      />
                    </div>

                    {/* Order Note */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                        Special Delivery Instructions <span className="text-stone-400 normal-case font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Leave at gate, call before delivery, fragile..."
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:outline-none focus:border-[#082a1c] transition"
                      />
                    </div>
                  </div>
                </div>



                {paymentError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{paymentError}</span>
                    </div>
                    <div className="border-t border-rose-200/50 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>Facing payment issues? Order directly with us:</span>
                      <a
                        href={getWhatsAppOrderUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        💬 Order via WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* RIGHT COLUMN (5 Cols): Order Summary & Detailed Price Breakdown */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              <div className="bg-[#fdf8ee] rounded-[2rem] p-6 border-2 border-[#cfa860]/60 shadow-2xl shadow-amber-900/10 space-y-5">


                <div className="flex items-center justify-between border-b-2 border-[#cfa860]/30 pb-3">
                  <h3 className="font-serif text-xl font-bold text-[#082a1c] flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#cfa860]" /> Order Summary
                  </h3>
                  <span className="text-xs font-bold text-[#082a1c] bg-[#cfa860]/25 px-3 py-1 rounded-full border border-[#cfa860]/50">
                    {items.reduce((acc, i) => acc + i.qty, 0)} Items
                  </span>
                </div>

                {/* Account Bag Items List with Quantity Controls */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((i) => (
                    <div key={i.name} className="flex gap-3.5 items-center bg-[#faf8f5] p-3 rounded-2xl border border-stone-200/80">
                      <img
                        src={i.img}
                        alt={i.name}
                        className="w-16 h-16 rounded-xl object-cover border border-[#cfa860]/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-stone-900 truncate">{i.name}</div>
                        <div className="text-xs text-amber-900 font-bold mt-0.5">{i.price}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <QuantityInput
                             value={i.qty}
                             onChange={(qty) => setQty(i.name, qty)}
                           />
                          <button
                            type="button"
                            onClick={() => removeItem(i.name)}
                            className="ml-auto text-[10px] uppercase font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Improved Promo Code Input Section */}
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">🏷️ Promo / Coupon / Referral Code</p>
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo / Coupon / Referral Code"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        className="flex-1 p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-base font-semibold focus:bg-white focus:ring-2 focus:ring-[#082a1c]/20 uppercase font-mono transition"
                      />
                      <button
                        type="submit"
                        className="px-4 py-3 bg-[#082a1c] text-[#e5c178] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-900 transition cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold">
                      <span>🏷️ Coupon <strong>{appliedCoupon.code}</strong> Applied!</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-rose-600 hover:underline uppercase font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown Details Box */}
                <div className="p-4.5 rounded-2xl bg-[#082a1c]/5 border border-[#cfa860]/20 space-y-3 text-xs">
                  <div className="font-serif text-base font-bold text-[#082a1c] border-b border-[#cfa860]/20 pb-2">
                    Price Breakdown & Tax Summary
                  </div>

                  <div className="flex justify-between text-stone-700">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-stone-900">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-700">
                    <span>
                      Delivery Fee{" "}
                      {freeThresholdConfig > 0 && subtotal < freeThresholdConfig && subtotal > 0 && (
                        <span className="text-[10px] text-stone-500 font-normal">
                          (Free over ₹{freeThresholdConfig})
                        </span>
                      )}
                    </span>
                    <span className={shippingFee === 0 ? "text-emerald-700 font-bold uppercase" : "font-bold text-stone-900"}>
                      {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-700 text-[11px]">
                    <span>GST Tax ({gstRate}%)</span>
                    <span className={isGstIncluded ? "text-emerald-700 font-bold uppercase text-[10px]" : "font-bold text-stone-900"}>
                      {isGstIncluded ? "Included in Price" : `+ ₹${gstAmount.toLocaleString("en-IN")}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-900 font-bold border-t border-[#cfa860]/30 pt-3 text-base">
                    <span>Total Amount Payable</span>
                    <span className="font-bold text-2xl text-[#082a1c]">
                      ₹{finalTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Estimated Delivery */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-200">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>📦 Estimated Delivery: <strong>{deliveryRange}</strong> (5–7 business days)</span>
                  </div>
                </div>

                {/* ── Payment Method Quick-Select (impossible to miss) ── */}
                <div className="rounded-2xl border-2 border-[#cfa860]/50 bg-[#fdf8ee] p-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#082a1c]/60 mb-2">
                    ⚡ Choose How to Pay
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Online */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("Cashfree")}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-bold transition cursor-pointer ${paymentMethod === "Cashfree"
                          ? "border-[#082a1c] bg-[#082a1c] text-[#cfa860] shadow-lg"
                          : "border-stone-300 bg-white text-stone-700 hover:border-[#082a1c]/40"
                        }`}
                    >
                      <CreditCard className={`w-5 h-5 ${paymentMethod === "Cashfree" ? "text-[#cfa860]" : "text-stone-500"}`} />
                      <span>Online Pay</span>
                      <span className={`text-[9px] font-normal leading-tight text-center ${paymentMethod === "Cashfree" ? "text-[#cfa860]/70" : "text-stone-400"}`}>
                        UPI · Cards · Net Banking
                      </span>
                    </button>

                    {/* COD */}
                    <button
                      type="button"
                      disabled={!storeSettings.isCodEnabled}
                      onClick={() => storeSettings.isCodEnabled && setPaymentMethod("COD")}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-bold transition ${!storeSettings.isCodEnabled
                          ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed opacity-50"
                          : paymentMethod === "COD"
                            ? "border-emerald-700 bg-emerald-700 text-white shadow-lg cursor-pointer"
                            : "border-stone-300 bg-white text-stone-700 hover:border-emerald-600/40 cursor-pointer"
                        }`}
                    >
                      <Truck className={`w-5 h-5 ${paymentMethod === "COD" && storeSettings.isCodEnabled ? "text-white" : "text-stone-500"}`} />
                      <span>Cash on Delivery</span>
                      <span className={`text-[9px] font-normal leading-tight text-center ${paymentMethod === "COD" && storeSettings.isCodEnabled ? "text-white/70" : "text-stone-400"}`}>
                        {storeSettings.isCodEnabled ? "Pay when it arrives" : "Currently unavailable"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Form Action Submit Button */}
                <button
                  type="submit"
                  form="full-page-checkout-form"
                  disabled={isProcessingPayment}
                  className="w-full py-4.5 rounded-full bg-[#082a1c] hover:bg-stone-900 text-[#cfa860] text-xs uppercase tracking-[0.25em] font-bold transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#cfa860] border-t-transparent rounded-full animate-spin" />
                      Initializing Payment...
                    </>
                  ) : paymentMethod === "Cashfree" ? (
                    "Pay Now with Cashfree"
                  ) : (
                    "Place Order (COD)"
                  )}
                </button>

                <p className="text-[10px] text-stone-500 text-center flex items-center justify-center gap-1 font-semibold pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Guaranteed Authentic & Encrypted Ayurvedic Checkout</span>
                </p>

                {/* Trust Badges Strip */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { icon: <Leaf className="w-4 h-4 text-emerald-600" />, label: "100% Ayurvedic" },
                    { icon: <Lock className="w-4 h-4 text-blue-600" />, label: "Secure Pay" },
                    { icon: <RotateCcw className="w-4 h-4 text-amber-600" />, label: "Easy Returns" },
                    { icon: <span className="text-base leading-none">🇮🇳</span>, label: "Made in India" },
                  ].map((b) => (
                    <div key={b.label} className="flex flex-col items-center gap-1 text-center p-2 bg-white rounded-xl border border-stone-200">
                      {b.icon}
                      <span className="text-[9px] font-bold text-stone-600 leading-tight">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
