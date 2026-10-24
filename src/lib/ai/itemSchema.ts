// Strict Zod validation schema for AI item replies (Rules.md section 2).

import { z } from "zod";
import type { QuotationItem } from "@/types/quotation";
import { rupeesToPaise } from "@/lib/money/formatMoney";
import { matchIconKey } from "@/lib/pdf/icons";

export const aiRawItemSchema = z.object({
  name: z.string().trim().min(1).max(250),
  quantity: z.number().int().min(1).max(99999).default(1),
  /** Unit price in rupees (for example 750 or 1700.50), or null when unreadable/missing. */
  unitPriceRupees: z.number().min(0).max(99_999_999).nullable(),
  note: z.string().max(250).nullable().optional(),
  confidence: z.enum(["high", "low"]).default("high"),
});

export const aiItemsReplySchema = z.object({
  items: z.array(aiRawItemSchema).min(1).max(200),
});

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

  // Compute median price to flag extreme outliers (Architecture.md section 4.3)
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
