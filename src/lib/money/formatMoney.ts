// Money formatting and calculation helpers.
// Rule: Money is always stored as whole paise (integers) to avoid rounding mistakes.
// Never use the rupee symbol (₹) — always write "Rs." when a prefix is needed.

/**
 * Formats whole integer paise into Indian-style rupees with two decimals (for example: 170000 -> "1,700.00").
 */
export function formatMoney(paise: number): string {
  if (!Number.isFinite(paise)) {
    return "0.00";
  }

  const roundedPaise = Math.round(paise);
  const isNegative = roundedPaise < 0;
  const absPaise = Math.abs(roundedPaise);

  const wholeRupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  const formattedRupees = formatIndianInteger(wholeRupees);
  const formattedPaise = String(remainderPaise).padStart(2, "0");

  return `${isNegative ? "-" : ""}${formattedRupees}.${formattedPaise}`;
}

/**
 * Formats whole integer paise with the "Rs. " prefix (for example: 421000 -> "Rs. 4,210.00").
 */
export function formatMoneyWithRs(paise: number): string {
  return `Rs. ${formatMoney(paise)}`;
}

/**
 * Formats a non-negative integer using Indian digit grouping (1,23,45,678).
 */
export function formatIndianInteger(value: number): string {
  const digits = String(Math.floor(Math.abs(value)));
  if (digits.length <= 3) {
    return digits;
  }

  const lastThree = digits.slice(-3);
  const leading = digits.slice(0, -3);
  const pairs = leading.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${pairs},${lastThree}`;
}

/**
 * Converts a user-entered rupee string or number (like "750", "1,700", "260.50")
 * into whole integer paise without floating-point errors. Returns null if invalid.
 */
export function rupeesToPaise(input: string | number): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return Math.round(input * 100);
  }

  const cleaned = input
    .trim()
    .replace(/^rs\.?\s*/i, "")
    .replace(/,/g, "");

  if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }

  const [rupeePart = "0", decPart = ""] = cleaned.split(".");
  const rupees = Number.parseInt(rupeePart, 10);
  const paddedPaise = (decPart + "00").slice(0, 2);
  const paise = Number.parseInt(paddedPaise, 10);

  if (!Number.isSafeInteger(rupees) || !Number.isSafeInteger(paise)) {
    return null;
  }

  return rupees * 100 + paise;
}

/**
 * Calculates a single row's total amount in whole paise (quantity x unit price).
 */
export function calculateItemAmountPaise(
  quantity: number,
  unitPricePaise: number | null
): number {
  if (unitPricePaise === null || !Number.isFinite(unitPricePaise) || unitPricePaise < 0) {
    return 0;
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }
  return Math.round(quantity * unitPricePaise);
}

/**
 * Calculates the grand total of all items in whole paise.
 */
export function calculateGrandTotalPaise(
  items: ReadonlyArray<{ quantity: number; unitPricePaise: number | null }>
): number {
  let total = 0;
  for (const item of items) {
    total += calculateItemAmountPaise(item.quantity, item.unitPricePaise);
  }
  return total;
}
