// Converts whole integer paise into Indian-style English words.
// Example: 421000 paise (Rs. 4,210.00) -> "Rupees Four Thousand Two Hundred Ten Only"

const ONES_AND_TEENS = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
] as const;

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
] as const;

function twoDigitsToWords(n: number): string {
  if (n <= 0) return "";
  if (n < 20) {
    return ONES_AND_TEENS[n] ?? "";
  }
  const ten = Math.floor(n / 10);
  const one = n % 10;
  const tenWord = TENS[ten] ?? "";
  const oneWord = ONES_AND_TEENS[one] ?? "";
  return oneWord ? `${tenWord} ${oneWord}` : tenWord;
}

/**
 * Converts a positive integer into Indian-system words (Thousand, Lakh, Crore).
 */
export function integerToIndianWords(num: number): string {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "Zero";

  const parts: string[] = [];

  const crores = Math.floor(n / 10_000_000);
  const remAfterCrores = n % 10_000_000;

  if (crores > 0) {
    parts.push(`${integerToIndianWords(crores)} Crore`);
  }

  const lakhs = Math.floor(remAfterCrores / 100_000);
  const remAfterLakhs = remAfterCrores % 100_000;

  if (lakhs > 0) {
    parts.push(`${twoDigitsToWords(lakhs)} Lakh`);
  }

  const thousands = Math.floor(remAfterLakhs / 1_000);
  const remAfterThousands = remAfterLakhs % 1_000;

  if (thousands > 0) {
    parts.push(`${twoDigitsToWords(thousands)} Thousand`);
  }

  const hundreds = Math.floor(remAfterThousands / 100);
  const lastTwo = remAfterThousands % 100;

  if (hundreds > 0) {
    parts.push(`${ONES_AND_TEENS[hundreds]} Hundred`);
  }

  if (lastTwo > 0) {
    parts.push(twoDigitsToWords(lastTwo));
  }

  return parts.join(" ");
}

/**
 * Converts an amount in whole paise (integer) into Indian amount-in-words format.
 * Always starts with "Rupees" and ends with "Only".
 *
 * Examples:
 * - 421000 -> "Rupees Four Thousand Two Hundred Ten Only"
 * - 170050 -> "Rupees One Thousand Seven Hundred and Fifty Paise Only"
 * - 0      -> "Rupees Zero Only"
 */
export function amountInWords(paise: number): string {
  if (!Number.isFinite(paise) || paise <= 0) {
    return "Rupees Zero Only";
  }

  const roundedPaise = Math.round(paise);
  const wholeRupees = Math.floor(roundedPaise / 100);
  const remainderPaise = roundedPaise % 100;

  const rupeeWords = integerToIndianWords(wholeRupees);

  if (remainderPaise === 0) {
    return `Rupees ${rupeeWords} Only`;
  }

  const paiseWords = twoDigitsToWords(remainderPaise);
  if (wholeRupees === 0) {
    return `Rupees Zero and ${paiseWords} Paise Only`;
  }

  return `Rupees ${rupeeWords} and ${paiseWords} Paise Only`;
}

/**
 * Convenience helper when given a rupee number directly (for example 4210 -> "Rupees Four Thousand Two Hundred Ten Only").
 */
export function rupeesInWords(rupees: number): string {
  if (!Number.isFinite(rupees) || rupees <= 0) {
    return "Rupees Zero Only";
  }
  return amountInWords(Math.round(rupees * 100));
}
