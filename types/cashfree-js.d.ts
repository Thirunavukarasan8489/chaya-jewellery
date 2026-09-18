// @cashfreepayments/cashfree-js ships no type declarations of its own.
// Narrow, hand-written types covering only the surface this project
// actually uses (load() + checkout()) — see
// https://www.npmjs.com/package/@cashfreepayments/cashfree-js
declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal" | (string & {});
  }

  export interface CashfreeCheckoutResult {
    error?: { message?: string };
    redirect?: boolean;
    paymentDetails?: { paymentMessage?: string };
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }

  export function load(config: { mode: "sandbox" | "production" }): Promise<CashfreeInstance>;
}
