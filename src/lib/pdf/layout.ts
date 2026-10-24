// Pure layout, text-wrapping, and page-splitting calculations for the sporty PDF engine.
// Covered by automatic tests in tests/pagination.test.ts for 1, 14, 15, 50, and 100 items.

import type { QuotationItem } from "@/types/quotation";
import { PDF_DIMENSIONS } from "@/lib/pdf/theme";

export type MeasureTextWidthFn = (text: string, fontSize: number, isBold: boolean) => number;

export interface MeasuredRow {
  item: QuotationItem;
  serialNumber: number;
  nameLines: string[];
  noteLines: string[];
  rowHeight: number;
}

export interface PdfPagePlan {
  pageNumber: number;
  isFirstPage: boolean;
  rows: MeasuredRow[];
  /** True when the 3pt orange table-closing line should be drawn at the bottom of the rows on this page. */
  closesTable: boolean;
  /** True when the total bar, amount in words, bank card, and signature are drawn on this page. */
  hasClosingBlock: boolean;
}

/**
 * Default character-width estimator used in pure pagination tests when no PDF font is loaded.
 */
export const defaultMeasureTextWidth: MeasureTextWidthFn = (
  text: string,
  fontSize: number,
  isBold: boolean
): number => {
  const avgFactor = isBold ? 0.5 : 0.46;
  return text.length * fontSize * avgFactor;
};

/**
 * Wraps a text string into lines that never exceed maxWidthPoints.
 */
export function wrapTextToLines(
  text: string,
  maxWidthPoints: number,
  fontSize: number,
  isBold: boolean,
  measureWidth: MeasureTextWidthFn = defaultMeasureTextWidth
): string[] {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return [""];

  const words = cleaned.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureWidth(candidate, fontSize, isBold) <= maxWidthPoints) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }

    // If a single very long word exceeds maxWidthPoints, split it by characters
    if (measureWidth(word, fontSize, isBold) > maxWidthPoints) {
      let chunk = "";
      for (const ch of word) {
        const nextChunk = chunk + ch;
        if (measureWidth(nextChunk, fontSize, isBold) > maxWidthPoints && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk = nextChunk;
        }
      }
      currentLine = chunk;
    } else {
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

/**
 * Calculates wrapped lines and exact vertical height for a single item row.
 */
export function measureQuotationRow(
  item: QuotationItem,
  serialNumber: number,
  measureWidth: MeasureTextWidthFn = defaultMeasureTextWidth
): MeasuredRow {
  const maxItemTextWidth = PDF_DIMENSIONS.colItem - 14;
  const nameLines = wrapTextToLines(
    item.name,
    maxItemTextWidth,
    10.5,
    true,
    measureWidth
  );

  const noteLines = item.note?.trim()
    ? wrapTextToLines(
        item.note.trim(),
        maxItemTextWidth,
        8.5,
        false,
        measureWidth
      )
    : [];

  const hasNote = noteLines.length > 0;
  const baseHeight = hasNote
    ? PDF_DIMENSIONS.noteRowHeight
    : PDF_DIMENSIONS.normalRowHeight;

  const extraNameLines = Math.max(0, nameLines.length - 1);
  const extraNoteLines = Math.max(0, noteLines.length - 1);
  const extraHeight =
    (extraNameLines + extraNoteLines) * PDF_DIMENSIONS.extraWrappedLineHeight;

  return {
    item,
    serialNumber,
    nameLines,
    noteLines,
    rowHeight: baseHeight + extraHeight,
  };
}

/**
 * Available vertical space for table rows on Page 1 vs Page 2+.
 */
export function getAvailableTableHeight(isFirstPage: boolean): number {
  const bottomLimit =
    PDF_DIMENSIONS.footerHeight + PDF_DIMENSIONS.footerSafetyMargin; // 78pt

  if (isFirstPage) {
    const topUsed =
      PDF_DIMENSIONS.page1HeaderHeight +
      PDF_DIMENSIONS.page1HeaderUnderline +
      PDF_DIMENSIONS.buyerBlockTopGap +
      PDF_DIMENSIONS.buyerBarHeight +
      PDF_DIMENSIONS.buyerBlockBottomGap +
      PDF_DIMENSIONS.tableHeaderHeight; // 148 + 5 + 24 + 44 + 20 + 28 = 269pt
    return PDF_DIMENSIONS.pageHeight - topUsed - bottomLimit; // 494.89pt
  }

  const laterTopUsed =
    PDF_DIMENSIONS.laterPageHeaderHeight +
    PDF_DIMENSIONS.laterPageHeaderUnderline +
    18 +
    PDF_DIMENSIONS.tableHeaderHeight; // 56 + 3 + 18 + 28 = 105pt
  return PDF_DIMENSIONS.pageHeight - laterTopUsed - bottomLimit; // 658.89pt
}

/**
 * Splits items across A4 pages following Rules.md section 5:
 * - Page 1 has full header + buyer block + table header.
 * - Page 2+ has slim header + repeated table header.
 * - Before placing each row, checks space left on the page and starts a new page when needed.
 * - Keeps the closing block (total bar, amount in words, bank card, signature) together on the last page.
 *   If it does not fit under the last row, moves the entire closing block to a fresh page.
 */
export function paginateQuotationItems(
  items: ReadonlyArray<QuotationItem>,
  measureWidth: MeasureTextWidthFn = defaultMeasureTextWidth
): PdfPagePlan[] {
  const measuredRows = items.map((item, idx) =>
    measureQuotationRow(item, idx + 1, measureWidth)
  );

  const pages: PdfPagePlan[] = [
    {
      pageNumber: 1,
      isFirstPage: true,
      rows: [],
      closesTable: false,
      hasClosingBlock: false,
    },
  ];

  let currentPage = pages[0]!;
  let remainingHeight = getAvailableTableHeight(true);

  for (const row of measuredRows) {
    if (
      currentPage.rows.length > 0 &&
      row.rowHeight + PDF_DIMENSIONS.tableBottomOrangeLine > remainingHeight
    ) {
      currentPage = {
        pageNumber: pages.length + 1,
        isFirstPage: false,
        rows: [],
        closesTable: false,
        hasClosingBlock: false,
      };
      pages.push(currentPage);
      remainingHeight = getAvailableTableHeight(false);
    }

    currentPage.rows.push(row);
    remainingHeight -= row.rowHeight;
  }

  // Mark the page containing the last item row so the 3pt orange closing line is drawn right under it
  currentPage.closesTable = true;
  remainingHeight -= PDF_DIMENSIONS.tableBottomOrangeLine;

  // Check if the closing block (total bar + words + bank card + signature) fits on the current last page
  if (remainingHeight >= PDF_DIMENSIONS.closingBlockHeight) {
    currentPage.hasClosingBlock = true;
  } else {
    // Move the entire closing block together onto a fresh final page
    pages.push({
      pageNumber: pages.length + 1,
      isFirstPage: false,
      rows: [],
      closesTable: false,
      hasClosingBlock: true,
    });
  }

  return pages;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * Formats an ISO date ("2026-10-22") as "22 October 2026" for the quotation header.
 */
export function formatQuotationDisplayDate(isoDate: string): string {
  const trimmed = isoDate.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed || "Today";
  const year = Number.parseInt(match[1] ?? "2026", 10);
  const monthIdx = Number.parseInt(match[2] ?? "1", 10) - 1;
  const day = Number.parseInt(match[3] ?? "1", 10);
  const monthName = MONTH_NAMES[monthIdx] ?? "January";
  return `${day} ${monthName} ${year}`;
}
