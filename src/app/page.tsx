"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiResponse, Quotation } from "@/types/quotation";
import { createEmptyDraft, saveDraftToPhone } from "@/lib/draft/draftStore";
import { formatMoneyWithRs } from "@/lib/money/formatMoney";
import { formatQuotationDisplayDate } from "@/lib/pdf/layout";

export default function HomePage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/quotations", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/pin?next=/");
          return;
        }
        const payload = (await res.json()) as ApiResponse<Quotation[]>;
        if (!active) return;
        if (payload.ok) {
          setQuotations(payload.data);
        } else {
          setErrorMessage(payload.message);
        }
      } catch {
        if (active) {
          setErrorMessage("Could not load saved quotations. Please check your connection.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const filteredQuotations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return quotations;
    return quotations.filter((item) => {
      const displayDate = formatQuotationDisplayDate(item.quotationDate).toLowerCase();
      return (
        item.buyerName.toLowerCase().includes(q) ||
        item.buyerAddress.toLowerCase().includes(q) ||
        item.quotationDate.toLowerCase().includes(q) ||
        displayDate.includes(q) ||
        (item.quotationNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [quotations, searchQuery]);

  const handleDuplicate = (q: Quotation) => {
    const fresh = createEmptyDraft();
    saveDraftToPhone({
      buyerName: q.buyerName,
      buyerAddress: q.buyerAddress,
      quotationDate: fresh.quotationDate,
      numberEnabled: false,
      items: q.items.map((it, idx) => ({
        ...it,
        id: `dup-${Date.now()}-${idx + 1}`,
      })),
    });
    router.push("/new");
  };

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
              HISTORY &amp; DRAFTS
            </p>
            <h1 className="text-2xl font-bold italic text-sultan-ink">
              Saved Quotations
            </h1>
          </div>
          <Link
            href="/settings"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-3 text-sm font-bold text-sultan-black active:bg-sultan-lightGrey"
          >
            Settings
          </Link>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by buyer name or date..."
          className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-lightGrey px-3 py-2 text-base text-sultan-ink placeholder:text-sultan-grey focus:border-sultan-orange focus:outline-none"
        />

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border-l-4 border-sultan-errorRed bg-sultan-lightGrey p-3 text-sm font-bold text-sultan-errorRed"
          >
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl bg-sultan-lightGrey p-6 text-center text-sm font-bold text-sultan-grey">
            Loading saved quotations...
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="rounded-xl bg-sultan-lightGrey p-5 text-center">
            <p className="text-base font-bold text-sultan-ink">
              {quotations.length === 0
                ? "No saved quotations yet."
                : "No quotations match your search."}
            </p>
            <p className="mt-1 text-sm text-sultan-grey">
              Tap the orange button below to create a quotation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotations.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-sultan-lineGrey bg-sultan-lightGrey p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/q/${q.id}`}
                      className="block truncate text-base font-bold text-sultan-ink hover:underline"
                    >
                      {q.buyerName}
                    </Link>
                    {q.buyerAddress ? (
                      <p className="truncate text-xs text-sultan-grey">
                        {q.buyerAddress}
                      </p>
                    ) : null}
                  </div>
                  {q.quotationNumber ? (
                    <span className="shrink-0 rounded-md bg-sultan-black px-2 py-0.5 text-xs font-bold text-sultan-orange">
                      {q.quotationNumber}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-sultan-lineGrey pt-2.5">
                  <div>
                    <p className="text-xs font-bold text-sultan-grey">
                      {formatQuotationDisplayDate(q.quotationDate)} &bull;{" "}
                      {q.items.length} {q.items.length === 1 ? "item" : "items"}
                    </p>
                    <p className="font-mono text-base font-bold italic tabular-nums text-sultan-ink">
                      {formatMoneyWithRs(q.totalPaise)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(q)}
                      className="min-h-[40px] rounded-xl border border-sultan-black bg-sultan-white px-3 text-xs font-bold text-sultan-black active:bg-sultan-lightGrey"
                    >
                      Duplicate
                    </button>
                    <Link
                      href={`/q/${q.id}`}
                      className="flex min-h-[40px] items-center justify-center rounded-xl bg-sultan-orange px-3 text-xs font-bold text-sultan-black"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="sticky bottom-4 pt-2">
        <Link
          href="/new"
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sultan-orange px-4 py-3 text-base font-bold text-sultan-black shadow-md active:opacity-90"
        >
          + New Quotation
        </Link>
      </div>
    </div>
  );
}
