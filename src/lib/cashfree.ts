import { load, type Cashfree } from "@cashfreepayments/cashfree-js";

let cashfreeInstancePromise: Promise<Cashfree | null> | null = null;

export async function getCashfreeInstance(): Promise<Cashfree | null> {
  if (typeof window === "undefined") return null;

  if (!cashfreeInstancePromise) {
    const mode = ((import.meta.env.VITE_CASHFREE_ENV as string) || "sandbox") as
      | "sandbox"
      | "production";

    cashfreeInstancePromise = load({ mode }).catch((err: any) => {
      console.error("Failed to load Cashfree JS SDK:", err);
      cashfreeInstancePromise = null;
      return null;
    });
  }

  return cashfreeInstancePromise;
}
