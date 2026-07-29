declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_modal" | "_self" | "_blank" | HTMLElement;
  }

  export interface CashfreeResult {
    error?: {
      message?: string;
      code?: string;
    };
    redirect?: boolean;
    paymentDetails?: Record<string, any>;
  }

  export interface Cashfree {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeResult>;
  }

  export function load(config: { mode: "sandbox" | "production" }): Promise<Cashfree>;
}
