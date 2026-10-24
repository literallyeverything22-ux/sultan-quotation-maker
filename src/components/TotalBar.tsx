"use client";

import type { QuotationItem } from "@/types/quotation";
import { amountInWords } from "@/lib/money/amountInWords";
import {
  calculateGrandTotalPaise,
  formatMoneyWithRs,
} from "@/lib/money/formatMoney";

interface TotalBarProps {
  items: QuotationItem[];
  onCreatePdf?: () => void;
}

export function TotalBar({ items, onCreatePdf }: TotalBarProps) {
  const totalPaise = calculateGrandTotalPaise(items);
  const words = amountInWords(totalPaise);

  const missingPriceCount = items.filter(
    (item) => item.unitPricePaise === null || item.unitPricePaise <= 0
  ).length;

  const canCreatePdf = items.length > 0 && missingPriceCount === 0;

  return (
    <section className="sticky bottom-0 z-20 -mx-4 border-t-2 border-sultan-black bg-sultan-white px-4 pb-4 pt-3 shadow-lg">
      {/* Orange slanted total bar matching Design.md section 3.5 & 4.4 */}
      <div className="flex items-center justify-between rounded-xl bg-sultan-orange px-4 py-2.5 text-sultan-black">
        <span className="text-xs font-bold uppercase tracking-wider">
          Total (Including GST)
        </span>
        <span className="text-lg font-bold italic tabular-nums">
          {formatMoneyWithRs(totalPaise)}
        </span>
      </div>

      {/* Amount in words */}
      <div className="mt-2 px-1">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-sultan-orange">
          Amount in Words
        </span>
        <p className="text-xs italic text-sultan-ink">{words}</p>
      </div>

      {/* Create PDF button (disabled with reason if any row is missing a price) */}
      <div className="mt-3">
        {missingPriceCount > 0 ? (
          <p className="mb-1.5 text-center text-xs font-bold text-sultan-errorRed">
            Fix {missingPriceCount}{" "}
            {missingPriceCount === 1
              ? "row with a missing price"
              : "rows with missing prices"}{" "}
            before creating the PDF.
          </p>
        ) : null}

        <button
          type="button"
          disabled={!canCreatePdf}
          onClick={onCreatePdf}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sultan-black px-4 py-3 text-base font-bold text-sultan-white active:opacity-90 disabled:opacity-40"
        >
          {items.length === 0
            ? "Add Items to Create PDF"
            : missingPriceCount > 0
              ? "Fix Missing Prices First"
              : "Create PDF (Connected in Phase 6)"}
        </button>
      </div>
    </section>
  );
}
