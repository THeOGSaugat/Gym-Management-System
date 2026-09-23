import type { PaymentMethod } from "@/generated/prisma/client";

/**
 * How a payment method is written for a human. Previously inlined as a
 * nested ternary on four different pages, which is why "BANK_TRANSFER"
 * rendered as "Bank transfer" in some places and raw in others.
 */
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABEL[method] ?? method;
}
