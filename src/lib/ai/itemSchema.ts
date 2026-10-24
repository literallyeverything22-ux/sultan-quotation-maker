// Strict validation schema for AI item replies (Rules.md section 2).

import { z } from "zod";
import type { QuotationItem } from "@/types/quotation";
import { rupeesToPaise } from "@/lib/money/formatMoney";
import { matchIconKey } from "@/lib/pdf/icons";

function parseFlexibleNumber(val: unknown): number | null {
  if (typeof val === "number") {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === "string") {
    const cleaned = val
      .replace(/rs\.?|inr|₹|\/-|\s|,/gi, "")
      .trim();
    if (!cleaned) return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export const aiRawItemSchema = z.object({
  name: z.string().trim().min(1).max(250),
  quantity: z.preprocess((val) => {
    const num = parseFlexibleNumber(val);
    if (num === null || num < 1) return 1;
    return Math.round(num);
  }, z.number().int().min(1).max(99999)),
  /** Unit price in rupees (for example 750 or 1700.50), or null when unreadable/missing. */
  unitPriceRupees: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") return null;
    const num = parseFlexibleNumber(val);
    if (num === null || num < 0) return null;
    return num;
  }, z.number().min(0).max(99_999_999).nullable()),
  note: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : null),
    z.string().max(250).nullable().optional()
  ),
  confidence: z.preprocess((val) => {
    if (typeof val === "string" && val.trim().toLowerCase() === "high") {
      return "high";
    }
    return "low";
  }, z.enum(["high", "low"])),
});

export const aiItemsReplySchema = z.preprocess((val) => {
  if (Array.isArray(val)) {
    return { items: val };
  }
  if (
    typeof val === "object" &&
    val !== null &&
    !("items" in val) &&
    "name" in val
  ) {
    return { items: [val] };
  }
  return val;
}, z.object({
  items: z.array(aiRawItemSchema).min(1).max(200),
}));

export type AiRawItem = z.infer<typeof aiRawItemSchema>;

/**
 * Converts validated AI items into QuotationItem[] with integer paise prices,
 * equipment icon keys, and automatic needsReview flags for uncertain or outlier items.
 */
export function mapAiItemsToQuotationItems(
  rawItems: ReadonlyArray<AiRawItem>
): QuotationItem[] {
  const validPrices = rawItems
    .map((it) => it.unitPriceRupees)
    .filter((p): p is number => p !== null && p > 0);

  let medianPrice = 0;
  if (validPrices.length >= 3) {
    const sorted = [...validPrices].sort((a, b) => a - b);
    medianPrice = sorted[Math.floor(sorted.length / 2)] ?? 0;
  }

  return rawItems.map((raw, idx) => {
    const hasValidPrice =
      raw.unitPriceRupees !== null &&
      Number.isFinite(raw.unitPriceRupees) &&
      raw.unitPriceRupees > 0;

    const unitPricePaise = hasValidPrice
      ? rupeesToPaise(raw.unitPriceRupees!)
      : null;

    const isOutlier =
      hasValidPrice &&
      medianPrice > 0 &&
      (raw.unitPriceRupees! > medianPrice * 20 ||
        raw.unitPriceRupees! < medianPrice / 20);

    const needsReview =
      raw.confidence === "low" || !hasValidPrice || isOutlier;

    return {
      id: `ai-${Date.now()}-${idx + 1}`,
      name: raw.name.trim(),
      quantity: Math.max(1, Math.round(raw.quantity || 1)),
      unitPricePaise,
      note: raw.note?.trim() || undefined,
      iconKey: matchIconKey(raw.name),
      needsReview,
    };
  });
}
