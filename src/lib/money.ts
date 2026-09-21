/**
 * Money is always stored and computed as an integer number of minor
 * units (cents) — never a float — everywhere in this codebase
 * (MembershipPlan.priceMinor, Membership.priceMinorSnapshot,
 * Payment.amountMinor). These are the only two places that convert to
 * and from the decimal string a human types into a form.
 */

/** "49.99" -> 4999. Returns null if the input isn't a valid non-negative amount. */
export function parseMinorUnits(decimalAmount: string): number | null {
  const trimmed = decimalAmount.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [wholePart, fractionPart = ""] = trimmed.split(".");
  const cents = fractionPart.padEnd(2, "0").slice(0, 2);
  const minorUnits = Number(wholePart) * 100 + Number(cents);
  return Number.isSafeInteger(minorUnits) ? minorUnits : null;
}

/** 4999 -> "49.99" */
export function formatMinorUnits(minorUnits: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    minorUnits / 100,
  );
}

/** 4999 -> "49.99" (no currency symbol, for pre-filling an editable amount input) */
export function toDecimalString(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}
