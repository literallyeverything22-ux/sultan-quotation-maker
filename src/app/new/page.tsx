"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiResponse, Quotation, QuotationItem } from "@/types/quotation";
import { BuyerForm } from "@/components/BuyerForm";
import { ItemList } from "@/components/ItemList";
import { PdfPreview } from "@/components/PdfPreview";
import { TextPaste } from "@/components/TextPaste";
import { TotalBar } from "@/components/TotalBar";
import {
  clearDraftFromPhone,
  createEmptyDraft,
  loadDraftFromPhone,
  saveDraftToPhone,
} from "@/lib/draft/draftStore";

export default function NewQuotationPage() {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerAddress, setBuyerAddress] = useState<string>("");
  const [quotationDate, setQuotationDate] = useState<string>(() =>
    createEmptyDraft().quotationDate
  );
  const [numberEnabled, setNumberEnabled] = useState<boolean>(false);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [buildRequestCounter, setBuildRequestCounter] = useState<number>(0);
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/auth", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/pin?next=/new");
        }
      })
      .catch(() => {
        // Keep working offline if already on the screen
      });

    const saved = loadDraftFromPhone();
    if (saved) {
      setBuyerName(saved.buyerName);
      setBuyerAddress(saved.buyerAddress);
      setQuotationDate(saved.quotationDate);
      setNumberEnabled(saved.numberEnabled);
      setItems(saved.items);
    }
    setIsLoaded(true);
  }, [router]);

  useEffect(() => {
    if (!isLoaded) return;
    saveDraftToPhone({
      buyerName,
      buyerAddress,
      quotationDate,
      numberEnabled,
      items,
    });
  }, [buyerName, buyerAddress, quotationDate, numberEnabled, items, isLoaded]);

  const handleBuyerChange = (updates: {
    buyerName?: string;
    buyerAddress?: string;
    quotationDate?: string;
  }) => {
    if (updates.buyerName !== undefined) setBuyerName(updates.buyerName);
    if (updates.buyerAddress !== undefined)
      setBuyerAddress(updates.buyerAddress);
    if (updates.quotationDate !== undefined)
      setQuotationDate(updates.quotationDate);
  };

  const handleItemsParsed = (
    parsedItems: QuotationItem[],
    mode: "replace" | "append"
  ) => {
    if (mode === "replace") {
      setItems(parsedItems);
    } else {
      setItems((prev) => [...prev, ...parsedItems]);
    }
  };

  const handleClearDraft = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    const fresh = createEmptyDraft();
    clearDraftFromPhone();
    setBuyerName(fresh.buyerName);
    setBuyerAddress(fresh.buyerAddress);
    setQuotationDate(fresh.quotationDate);
    setNumberEnabled(fresh.numberEnabled);
    setItems([]);
    setSavedQuotationId(null);
    setSaveNotice(null);
    setConfirmClear(false);
  };

  const handleCreatePdfAndSave = async () => {
    setBuildRequestCounter((prev) => prev + 1);
    setIsSaving(true);
    setSaveNotice(null);

    try {
      const endpoint = savedQuotationId
        ? `/api/quotations/${savedQuotationId}`
        : "/api/quotations";
      const method = savedQuotationId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: buyerName.trim() || "The Superintendent",
          buyerAddress: buyerAddress.trim(),
          quotationDate,
          items: items.map((it) => ({
            ...it,
            unitPricePaise: it.unitPricePaise ?? 0,
          })),
        }),
      });

      const payload = (await res.json()) as ApiResponse<Quotation>;
      if (payload.ok) {
        setSavedQuotationId(payload.data.id);
        setSaveNotice({
          type: "success",
          text: "Quotation saved to history and PDF ready below.",
        });
      } else {
        setSaveNotice({
          type: "error",
          text: payload.message,
        });
      }
    } catch {
      setSaveNotice({
        type: "error",
        text: "Could not save to cloud right now, but your PDF and phone draft are ready.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-between gap-5">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
              AUTO-SAVED DRAFT
            </p>
            <h1 className="text-2xl font-bold italic text-sultan-ink">
              New Quotation
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 || buyerName.trim() ? (
              <button
                type="button"
                onClick={handleClearDraft}
                className="min-h-[44px] rounded-xl border border-sultan-errorRed bg-sultan-white px-3 text-xs font-bold text-sultan-errorRed"
              >
                {confirmClear ? "Confirm Clear" : "Clear Draft"}
              </button>
            ) : null}

            <Link
              href="/"
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-3 text-sm font-bold text-sultan-black active:bg-sultan-lightGrey"
            >
              Back
            </Link>
          </div>
        </div>

        {saveNotice ? (
          <div
            role="status"
            className={`rounded-xl border-l-4 p-3 text-sm font-bold ${
              saveNotice.type === "error"
                ? "border-sultan-errorRed bg-sultan-lightGrey text-sultan-errorRed"
                : "border-sultan-orange bg-sultan-lightGrey text-sultan-ink"
            }`}
          >
            {saveNotice.text}
          </div>
        ) : null}

        <BuyerForm
          buyerName={buyerName}
          buyerAddress={buyerAddress}
          quotationDate={quotationDate}
          onChange={handleBuyerChange}
        />

        <TextPaste
          onItemsParsed={handleItemsParsed}
          hasExistingItems={items.length > 0}
        />

        <ItemList items={items} onChange={setItems} />

        <PdfPreview
          buyerName={buyerName}
          buyerAddress={buyerAddress}
          quotationDate={quotationDate}
          items={items}
          buildRequestCounter={buildRequestCounter}
        />
      </div>

      <TotalBar
        items={items}
        isBuilding={isSaving}
        onCreatePdf={() => void handleCreatePdfAndSave()}
      />
    </div>
  );
}
