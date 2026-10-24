"use client";

import { useState } from "react";
import type { QuotationItem } from "@/types/quotation";
import { parseTextList } from "@/lib/parse/parseTextList";

interface TextPasteProps {
  onItemsParsed: (items: QuotationItem[], mode: "replace" | "append") => void;
  hasExistingItems: boolean;
}

const SAMPLE_5_LINES = [
  "Cosco Acclaim Volleyball - 750",
  "Volleyball Net - 450",
  "Ludo & Snakes Board - 260",
  "Strox Carrom Board - 1700 | Comes with coins, striker & powder",
  "Chess Set x2 525",
].join("\n");

function buildSample100Lines(): string {
  const base = [
    "Cosco Acclaim Volleyball - 750",
    "Volleyball Net - 450",
    "Ludo & Snakes Board - 260",
    "Strox Carrom Board - 1700 | Comes with coins, striker & powder",
    "Chess Set x2 525",
    "Nivia Storm Football - 890",
    "Cricket Tennis Ball x6 85",
    "Badminton Racket Pair - 650",
    "Skipping Rope x4 120",
    "Carrom Striker Tournament - 180",
  ];
  const lines: string[] = [];
  for (let i = 0; i < 100; i++) {
    const template = base[i % base.length] ?? "Sports Item - 500";
    lines.push(`${i + 1}. ${template}`);
  }
  return lines.join("\n");
}

export function TextPaste({ onItemsParsed, hasExistingItems }: TextPasteProps) {
  const [text, setText] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(!hasExistingItems);

  const handleReadText = (mode: "replace" | "append") => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const parsed = parseTextList(trimmed);
    if (parsed.length === 0) return;
    onItemsParsed(parsed, mode);
    setText("");
    setIsOpen(false);
  };

  return (
    <section className="space-y-3 rounded-xl bg-sultan-lightGrey p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
            Add Items (Paste or Type)
          </h2>
          <p className="text-xs text-sultan-grey">
            One item per line with name and price (e.g. Cosco Acclaim - 750)
          </p>
        </div>
        {hasExistingItems ? (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="min-h-[44px] rounded-xl border border-sultan-black bg-sultan-white px-3 text-xs font-bold uppercase text-sultan-black"
          >
            {isOpen ? "Hide Box" : "Paste More"}
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="space-y-3">
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              "Cosco Acclaim - 750\nLudo & Snakes 260\nChess x2 550"
            }
            className="w-full rounded-xl border border-sultan-lineGrey bg-sultan-white p-3 text-base text-sultan-ink"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setText(SAMPLE_5_LINES)}
              className="min-h-[44px] rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 text-xs font-bold text-sultan-ink active:bg-sultan-lightGrey"
            >
              Fill 5-Item Sample
            </button>
            <button
              type="button"
              onClick={() => setText(buildSample100Lines())}
              className="min-h-[44px] rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 text-xs font-bold text-sultan-ink active:bg-sultan-lightGrey"
            >
              Fill 100-Item Test List
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {hasExistingItems ? (
              <>
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={() => handleReadText("append")}
                  className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-sultan-orange px-4 py-2 text-base font-bold text-sultan-black disabled:opacity-40"
                >
                  Add to List
                </button>
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={() => handleReadText("replace")}
                  className="flex min-h-[48px] items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-4 py-2 text-sm font-bold text-sultan-black disabled:opacity-40"
                >
                  Replace All
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!text.trim()}
                onClick={() => handleReadText("replace")}
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sultan-orange px-4 py-3 text-base font-bold text-sultan-black active:opacity-90 disabled:opacity-40"
              >
                Read Items into Table
              </button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
