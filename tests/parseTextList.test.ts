import { describe, expect, it } from "vitest";
import { isItemNeedingAttention } from "@/components/ItemRow";
import {
  aiItemsReplySchema,
  mapAiItemsToQuotationItems,
} from "@/lib/ai/itemSchema";
import { extractJsonFromAiText } from "@/lib/ai/readItemsFromImage";
import { parseTextList } from "@/lib/parse/parseTextList";

describe("Phase 3: parseTextList", () => {
  it("reads standard item lines with prices and optional quantities", () => {
    const input = [
      "Cosco Acclaim - 750",
      "Ludo & Snakes 260",
      "Chess x2 550",
    ].join("\n");

    const items = parseTextList(input);
    expect(items).toHaveLength(3);

    expect(items[0]).toMatchObject({
      name: "Cosco Acclaim",
      quantity: 1,
      unitPricePaise: 75000,
      iconKey: "ball",
      needsReview: false,
    });

    expect(items[1]).toMatchObject({
      name: "Ludo & Snakes",
      quantity: 1,
      unitPricePaise: 26000,
      iconKey: "dice",
      needsReview: false,
    });

    expect(items[2]).toMatchObject({
      name: "Chess",
      quantity: 2,
      unitPricePaise: 55000,
      iconKey: "chess",
      needsReview: false,
    });
  });

  it("handles numbered lists, commas, Rs. prefix, nos/pcs, and pipe notes", () => {
    const input = [
      "1. Volleyball Net - Rs. 450/-",
      "2) Strox Carrom Board 3 nos : 1,700 | Comes with coins, striker & powder",
      "- Skipping Rope (x4) = 120.50",
    ].join("\n");

    const items = parseTextList(input);
    expect(items).toHaveLength(3);

    expect(items[0]).toMatchObject({
      name: "Volleyball Net",
      quantity: 1,
      unitPricePaise: 45000,
      iconKey: "net",
      needsReview: false,
    });

    expect(items[1]).toMatchObject({
      name: "Strox Carrom Board",
      quantity: 3,
      unitPricePaise: 170000,
      note: "Comes with coins, striker & powder",
      iconKey: "carrom",
      needsReview: false,
    });

    expect(items[2]).toMatchObject({
      name: "Skipping Rope",
      quantity: 4,
      unitPricePaise: 12050,
      iconKey: "generic",
      needsReview: false,
    });
  });

  it("keeps and flags messy or unclear lines instead of dropping them", () => {
    const messyInput = [
      "Cosco Acclaim - 750",
      "",
      "Carrom board powder without price",
      "750",
      "Cricket Bat 12 850",
    ].join("\n");

    const items = parseTextList(messyInput);
    // Blank line is skipped, but all 4 non-empty lines are kept
    expect(items).toHaveLength(4);

    // 1. Clean line
    expect(items[0]?.needsReview).toBe(false);

    // 2. Missing price -> kept with unitPricePaise: null and needsReview: true
    expect(items[1]).toMatchObject({
      name: "Carrom board powder without price",
      quantity: 1,
      unitPricePaise: null,
      needsReview: true,
    });

    // 3. Only a number -> kept and flagged
    expect(items[2]).toMatchObject({
      name: "750",
      unitPricePaise: 75000,
      needsReview: true,
    });

    // 4. Ambiguous stray number -> kept and flagged for review
    expect(items[3]).toMatchObject({
      name: "Cricket Bat 12",
      quantity: 1,
      unitPricePaise: 85000,
      needsReview: true,
    });
    expect(isItemNeedingAttention(items[1]!)).toBe(true);
    expect(isItemNeedingAttention(items[0]!)).toBe(false);
  });

  it("parses 100 pasted lines into 100 rows cleanly", () => {
    const lines = Array.from(
      { length: 100 },
      (_, idx) => `${idx + 1}. Cosco Volleyball #${idx + 1} - 750`
    ).join("\n");

    const items = parseTextList(lines);
    expect(items).toHaveLength(100);
    expect(items[0]?.name).toBe("Cosco Volleyball #1");
    expect(items[99]?.name).toBe("Cosco Volleyball #100");
    expect(items[99]?.unitPricePaise).toBe(75000);
  });

  it("validates AI photo-reading replies strictly and flags low-confidence or missing-price items", () => {
    const validReply = aiItemsReplySchema.safeParse({
      items: [
        {
          name: "Cosco Acclaim (Volleyball)",
          quantity: 1,
          unitPriceRupees: 750,
          note: null,
          confidence: "high",
        },
        {
          name: "Handwritten Unclear Net",
          quantity: 2,
          unitPriceRupees: 1700,
          note: null,
          confidence: "low",
        },
        {
          name: "Carrom Board Without Price",
          quantity: 1,
          unitPriceRupees: null,
          note: "Comes with coins",
          confidence: "high",
        },
      ],
    });

    expect(validReply.success).toBe(true);
    if (!validReply.success) return;

    const mapped = mapAiItemsToQuotationItems(validReply.data.items);
    expect(mapped).toHaveLength(3);
    expect(mapped[0]?.needsReview).toBe(false);
    expect(mapped[0]?.unitPricePaise).toBe(75000);
    expect(mapped[1]?.needsReview).toBe(true); // low confidence
    expect(mapped[2]?.needsReview).toBe(true); // missing price
    expect(mapped[2]?.unitPricePaise).toBeNull();
  });

  it("extracts JSON even when wrapped in prose and coerces stringified prices or arrays", () => {
    const raw =
      'Here are the items:\n```json\n[{"name":"Volleyball Net (Gupta)","quantity":"1","unitPriceRupees":"Rs. 1,700/-","confidence":"medium"}]\n```';
    const extracted = extractJsonFromAiText(raw);
    const parsed = aiItemsReplySchema.safeParse(extracted);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const mapped = mapAiItemsToQuotationItems(parsed.data.items);
    expect(mapped[0]).toMatchObject({
      name: "Volleyball Net (Gupta)",
      quantity: 1,
      unitPricePaise: 170000,
      iconKey: "net",
      needsReview: true, // medium confidence -> low -> flagged to check
    });
  });
});
