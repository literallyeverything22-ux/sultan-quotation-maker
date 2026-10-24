"use client";

import { useEffect, useState } from "react";
import type { ApiResponse } from "@/types/quotation";

interface NumberToggleProps {
  enabled: boolean;
  assignedNumber?: string | null;
  onChange: (enabled: boolean) => void;
}

export function NumberToggle({
  enabled,
  assignedNumber,
  onChange,
}: NumberToggleProps) {
  const [nextPreview, setNextPreview] = useState<string>("SE-0001");

  useEffect(() => {
    if (!enabled || assignedNumber) return;
    let active = true;
    fetch("/api/next-number", { cache: "no-store" })
      .then(
        (res) =>
          res.json() as Promise<
            ApiResponse<{ quotationNumber: string; numericValue: number }>
          >
      )
      .then((payload) => {
        if (active && payload.ok) {
          setNextPreview(payload.data.quotationNumber);
        }
      })
      .catch(() => {
        // Keep default preview if offline
      });
    return () => {
      active = false;
    };
  }, [enabled, assignedNumber]);

  return (
    <div className="rounded-xl border border-sultan-lineGrey bg-sultan-lightGrey p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="block text-base font-bold text-sultan-ink">
            Quotation number
          </span>
          <span className="block text-xs text-sultan-grey">
            {assignedNumber
              ? `Assigned: ${assignedNumber}`
              : enabled
                ? `Next: ${nextPreview} (given when Create PDF is tapped)`
                : "Off — no number will be shown on the PDF"}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Quotation number"
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-sultan-black transition-colors ${
            enabled ? "bg-sultan-orange" : "bg-sultan-lineGrey"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-sultan-black transition-transform ${
              enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
