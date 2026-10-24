// Local plain-text item list reader (Architecture.md section 4.2 & Phases.md Phase 3 Task 3).
// Reads lines like:
//   "Cosco Acclaim - 750"
//   "Ludo & Snakes 260"
//   "Chess x2 550"
// Unclear lines or lines missing a price are kept and flagged with needsReview = true, never dropped.

import type { QuotationItem } from "@/types/quotation";
import { rupeesToPaise } from "@/lib/money/formatMoney";
import { matchIconKey } from "@/lib/pdf/icons";

function makeItemId(index: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${index}`;
}

/**
 * Strips leading serial numbers or bullet markers like "1.", "2)", "-", or "•"
 * without stripping a number when that number is the entire line.
 */
function stripLeadingSerialOrBullet(line: string): string {
  const withoutBullet = line.replace(/^\s*(?:[-*•]+|\d+\s*[.)])\s+/, "");
  return withoutBullet.trim() ? withoutBullet.trim() : line.trim();
}

/**
 * Parses a single non-empty line into a QuotationItem.
 */
export function parseSingleTextLine(
  rawLine: string,
  index: number = 0
): QuotationItem {
  const id = makeItemId(index);
  const cleanedLine = stripLeadingSerialOrBullet(rawLine.trim());

  // Extract optional trailing note in [brackets] or after " | "
  let working = cleanedLine;
  let note: string | undefined;

  const pipeIndex = working.indexOf(" | ");
  if (pipeIndex > 0) {
    const potentialNote = working.slice(pipeIndex + 3).trim();
    const beforePipe = working.slice(0, pipeIndex).trim();
    if (potentialNote && beforePipe) {
      note = potentialNote;
      working = beforePipe;
    }
  }

  // Match a trailing price at the end of the line:
  // Supports optional separator (-, –, :, =, @), optional "Rs."/"INR", commas/decimals, and optional "/-"
  const priceMatch = working.match(
    /^(.*?)(?:[\s\-–—:=@]+)?(?:rs\.?|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(?:\/-)?\s*$/i
  );

  if (!priceMatch) {
    // No price found anywhere at the end -> keep the line and flag it for user attention
    const fallbackName = working || rawLine.trim();
    return {
      id,
      name: fallbackName,
      quantity: 1,
      unitPricePaise: null,
      note,
      iconKey: matchIconKey(fallbackName),
      needsReview: true,
    };
  }

  let leftSide = (priceMatch[1] ?? "").trim();
  const rawPriceText = (priceMatch[2] ?? "").trim();
  const unitPricePaise = rupeesToPaise(rawPriceText);

  // Clean trailing separators from the left side (like "-", ":", "=")
  leftSide = leftSide.replace(/[\s\-–—:=@]+$/, "").trim();

  // If the line was ONLY a price with no item name (e.g. "750"), keep it and flag it
  if (!leftSide) {
    return {
      id,
      name: rawLine.trim(),
      quantity: 1,
      unitPricePaise,
      note,
      iconKey: "generic",
      needsReview: true,
    };
  }

  // Extract optional quantity at the end of the item name:
  // Patterns:
  // 1) "Chess x2" or "Chess x 2" or "Chess * 2" or "Chess 2x"
  // 2) "Chess qty 2" or "Chess qty: 2"
  // 3) "Chess 2 nos" or "Chess 2 pcs" or "Chess 2 sets" or "Chess 2 pairs"
  // 4) "Chess (x2)"
  let quantity = 1;
  let itemName = leftSide;
  let needsReview = unitPricePaise === null || unitPricePaise <= 0;

  const qtyPatterns: ReadonlyArray<RegExp> = [
    /^(.*?)\s+\(\s*[xX*]\s*(\d+)\s*\)$/,
    /^(.*?)\s+[xX*]\s*(\d+)$/,
    /^(.*?)\s+(\d+)\s*[xX*]$/,
    /^(.*?)\s+(?:qty|quantity)\s*[:=-]?\s*(\d+)$/i,
    /^(.*?)\s+(\d+)\s*(?:nos\.?|pcs\.?|pieces|sets?|pairs?)$/i,
  ];

  for (const pattern of qtyPatterns) {
    const match = itemName.match(pattern);
    if (match) {
      const candidateName = (match[1] ?? "")
        .replace(/[\s\-–—:=,]+$/, "")
        .trim();
      const parsedQty = Number.parseInt(match[2] ?? "1", 10);
      if (candidateName && Number.isSafeInteger(parsedQty) && parsedQty > 0) {
        itemName = candidateName;
        quantity = parsedQty;
        break;
      }
    }
  }

  // Check if the remaining itemName ends with a bare stray number (ambiguous input like "Carrom 20 30")
  if (/\s+\d+$/.test(itemName) && quantity === 1) {
    needsReview = true;
  }

  return {
    id,
    name: itemName,
    quantity,
    unitPricePaise,
    note,
    iconKey: matchIconKey(itemName),
    needsReview,
  };
}

/**
 * Reads a multi-line pasted or typed text list into a flat array of QuotationItems.
 * Blank lines are ignored; unclear lines are kept and flagged with needsReview = true.
 */
export function parseTextList(text: string): QuotationItem[] {
  const lines = text.split(/\r?\n/);
  const items: QuotationItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]?.trim() ?? "";
    if (!rawLine) continue;
    items.push(parseSingleTextLine(rawLine, items.length));
  }

  return items;
}
