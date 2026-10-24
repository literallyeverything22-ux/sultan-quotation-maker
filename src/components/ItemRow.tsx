"use client";

import type { QuotationItem } from "@/types/quotation";
import {
  calculateItemAmountPaise,
  formatMoney,
} from "@/lib/money/formatMoney";

interface ItemRowProps {
  item: QuotationItem;
  serialNumber: number;
  isEven: boolean;
  onSelect: (item: QuotationItem) => void;
}

export function isItemNeedingAttention(item: QuotationItem): boolean {
  return (
    item.unitPricePaise === null ||
    item.unitPricePaise <= 0 ||
    Boolean(item.needsReview)
  );
}

export function ItemRow({
  item,
  serialNumber,
  isEven,
  onSelect,
}: ItemRowProps) {
  const needsAttention = isItemNeedingAttention(item);
  const amountPaise = calculateItemAmountPaise(
    item.quantity,
    item.unitPricePaise
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`flex min-h-[60px] w-full items-center justify-between gap-2 border-b border-sultan-lineGrey px-3 py-2.5 text-left transition-colors active:opacity-80 ${
        needsAttention
          ? "border-l-4 border-l-sultan-orange bg-sultan-attentionTint"
          : isEven
            ? "bg-sultan-lightGrey"
            : "bg-sultan-white"
      }`}
    >
      {/* Serial number + Item Name + Optional Note */}
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <span className="mt-0.5 flex h-6 min-w-[26px] items-center justify-center rounded-md bg-sultan-black px-1.5 text-xs font-bold tabular-nums text-sultan-white">
          {serialNumber}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="break-words text-sm font-bold text-sultan-ink">
              {item.name}
            </span>
            {needsAttention ? (
              <span className="inline-flex items-center rounded bg-sultan-orange px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sultan-black">
                Check
              </span>
            ) : null}
          </div>
          {item.note ? (
            <p className="mt-0.5 truncate text-xs italic text-sultan-grey">
              {item.note}
            </p>
          ) : null}
        </div>
      </div>

      {/* Quantity, Unit Price, and Line Amount */}
      <div className="flex shrink-0 items-center gap-3 text-right tabular-nums">
        <div className="w-9 text-center">
          <span className="block text-[10px] font-bold uppercase text-sultan-grey">
            Qty
          </span>
          <span className="text-sm text-sultan-ink">{item.quantity}</span>
        </div>

        <div className="w-16">
          <span className="block text-[10px] font-bold uppercase text-sultan-grey">
            Rate
          </span>
          {item.unitPricePaise !== null && item.unitPricePaise > 0 ? (
            <span className="text-xs text-sultan-ink">
              {formatMoney(item.unitPricePaise)}
            </span>
          ) : (
            <span className="text-xs font-bold text-sultan-errorRed">
              Missing
            </span>
          )}
        </div>

        <div className="w-20">
          <span className="block text-[10px] font-bold uppercase text-sultan-grey">
            Amount
          </span>
          <span className="text-sm font-bold text-sultan-ink">
            {item.unitPricePaise !== null && item.unitPricePaise > 0
              ? formatMoney(amountPaise)
              : "—"}
          </span>
        </div>
      </div>
    </button>
  );
}
