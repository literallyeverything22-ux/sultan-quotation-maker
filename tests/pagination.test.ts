import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  aiItemsReplySchema,
  mapAiItemsToQuotationItems,
} from "@/lib/ai/itemSchema";
import { setCachedLiberationFontBytes } from "@/lib/pdf/fonts";
import {
  measureQuotationRow,
  paginateQuotationItems,
  wrapTextToLines,
} from "@/lib/pdf/layout";
import {
  buildSampleQuotationItems,
  DEFAULT_BUSINESS_SETTINGS,
} from "@/lib/pdf/theme";
import { buildQuotationPdf } from "@/lib/pdf/buildQuotationPdf";

beforeAll(() => {
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  setCachedLiberationFontBytes({
    regular: new Uint8Array(
      fs.readFileSync(path.join(fontsDir, "LiberationSans-Regular.ttf"))
    ),
    bold: new Uint8Array(
      fs.readFileSync(path.join(fontsDir, "LiberationSans-Bold.ttf"))
    ),
    italic: new Uint8Array(
      fs.readFileSync(path.join(fontsDir, "LiberationSans-Italic.ttf"))
    ),
    boldItalic: new Uint8Array(
      fs.readFileSync(path.join(fontsDir, "LiberationSans-BoldItalic.ttf"))
    ),
  });
});

describe("paginateQuotationItems and text wrapping", () => {
  it("keeps 1 item and 5 items (including the approved Central Prison Kadapa sample) on 1 single page", () => {
    const oneItemPlan = paginateQuotationItems(buildSampleQuotationItems(1));
    expect(oneItemPlan).toHaveLength(1);
    expect(oneItemPlan[0]?.closesTable).toBe(true);
    expect(oneItemPlan[0]?.hasClosingBlock).toBe(true);

    const fiveItemPlan = paginateQuotationItems(buildSampleQuotationItems(5));
    expect(fiveItemPlan).toHaveLength(1);
    expect(fiveItemPlan[0]?.rows).toHaveLength(5);
    expect(fiveItemPlan[0]?.closesTable).toBe(true);
    expect(fiveItemPlan[0]?.hasClosingBlock).toBe(true);
  });

  it("splits 14 and 15 items cleanly across pages while keeping the closing block together", () => {
    const plan14 = paginateQuotationItems(buildSampleQuotationItems(14));
    expect(plan14.length).toBeGreaterThanOrEqual(2);
    expect(plan14.at(-1)?.hasClosingBlock).toBe(true);
    // Only the final page has the closing block
    for (let i = 0; i < plan14.length - 1; i++) {
      expect(plan14[i]?.hasClosingBlock).toBe(false);
    }

    const plan15 = paginateQuotationItems(buildSampleQuotationItems(15));
    expect(plan15.length).toBeGreaterThanOrEqual(2);
    expect(plan15.at(-1)?.hasClosingBlock).toBe(true);
    const totalRows15 = plan15.reduce((sum, p) => sum + p.rows.length, 0);
    expect(totalRows15).toBe(15);
  });

  it("paginates 50 and 100 items without losing any rows (100 items ~ 7 to 8 pages)", () => {
    const plan50 = paginateQuotationItems(buildSampleQuotationItems(50));
    const totalRows50 = plan50.reduce((sum, p) => sum + p.rows.length, 0);
    expect(totalRows50).toBe(50);
    expect(plan50.at(-1)?.hasClosingBlock).toBe(true);

    const plan100 = paginateQuotationItems(buildSampleQuotationItems(100));
    const totalRows100 = plan100.reduce((sum, p) => sum + p.rows.length, 0);
    expect(totalRows100).toBe(100);
    expect(plan100.length).toBeGreaterThanOrEqual(7);
    expect(plan100.length).toBeLessThanOrEqual(9);
    expect(plan100.at(-1)?.hasClosingBlock).toBe(true);
  });

  it("wraps long item names neatly and increases row height accordingly", () => {
    const lines = wrapTextToLines(
      "Heavy Duty Tournament Grade Outdoor Volleyball Net With Steel Cable And Side Bands",
      210,
      10.5,
      true
    );
    expect(lines.length).toBeGreaterThan(1);

    const measured = measureQuotationRow(
      {
        id: "long-1",
        name: "Heavy Duty Tournament Grade Outdoor Volleyball Net With Steel Cable And Side Bands",
        quantity: 2,
        unitPricePaise: 240000,
        note: "Supplied with extra tension rope and carry bag",
        iconKey: "net",
      },
      1
    );
    expect(measured.nameLines.length).toBeGreaterThan(1);
    expect(measured.rowHeight).toBeGreaterThan(50);
  });

  it("builds valid PDFs with embedded Liberation Sans fonts for 1, 5, 14, 15, 50, and 100 items", async () => {
    const counts = [1, 5, 14, 15, 50, 100] as const;

    for (const count of counts) {
      const pdfBytes = await buildQuotationPdf({
        buyerName: "The Superintendent",
        buyerAddress: "Central Prison, Kadapa.",
        quotationDate: "2026-10-22",
        quotationNumber: count === 5 ? null : "SE-0001",
        items: buildSampleQuotationItems(count),
        settings: DEFAULT_BUSINESS_SETTINGS,
      });

      expect(pdfBytes.byteLength).toBeGreaterThan(5000);
      const loaded = await PDFDocument.load(pdfBytes);
      if (count === 1 || count === 5) {
        expect(loaded.getPageCount()).toBe(1);
      } else if (count === 100) {
        expect(loaded.getPageCount()).toBeGreaterThanOrEqual(7);
        expect(loaded.getPageCount()).toBeLessThanOrEqual(9);
      }
    }
  });

  it("converts a 100-item photo reading reply end-to-end into a multi-page sporty PDF", async () => {
    const rawPhotoReply = {
      items: Array.from({ length: 100 }, (_, i) => ({
        name: `Sports Equipment Item #${i + 1} (${i % 2 === 0 ? "Volleyball" : "Carrom Board"})`,
        quantity: (i % 4) + 1,
        unitPriceRupees: 250 + (i % 10) * 75,
        note: i % 5 === 0 ? "Tournament grade" : "",
        confidence: "high",
      })),
    };

    const parsed = aiItemsReplySchema.safeParse(rawPhotoReply);
    expect(parsed.success).toBe(true);
    const items = mapAiItemsToQuotationItems(parsed.data?.items ?? []);
    expect(items).toHaveLength(100);

    const pdfBytes = await buildQuotationPdf({
      buyerName: "District Sports Authority",
      buyerAddress: "Kadapa, Andhra Pradesh",
      quotationDate: "2026-10-24",
      quotationNumber: "SE-0010",
      items: items ?? [],
      settings: DEFAULT_BUSINESS_SETTINGS,
    });

    const loaded = await PDFDocument.load(pdfBytes);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(7);
    expect(loaded.getPageCount()).toBeLessThanOrEqual(9);
  });
});
