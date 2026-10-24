"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiResponse, Quotation, QuotationItem } from "@/types/quotation";
import { BuyerForm, ScreenErrorBoundary } from "@/components/BuyerForm";
import { ItemList } from "@/components/ItemList";
import { NumberToggle } from "@/components/NumberToggle";
import { PdfPreview } from "@/components/PdfPreview";
import { PhotoPicker } from "@/components/PhotoPicker";
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
  const [assignedNumber, setAssignedNumber] = useState<string | null>(null);
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

  const handleItemsAdded = (
    newItems: QuotationItem[],
    mode: "replace" | "append"
  ) => {
    if (mode === "replace") {
      setItems(newItems);
    } else {
      setItems((prev) => [...prev, ...newItems]);
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
    setAssignedNumber(null);
    setItems([]);
    setSavedQuotationId(null);
    setSaveNotice(null);
    setConfirmClear(false);
  };

  const handleCreatePdfAndSave = async () => {
    setIsSaving(true);
    setSaveNotice(null);

    try {
      // 1. If numbering is ON and we have not claimed a number yet, claim it once now
      let numberToUse: string | null = numberEnabled ? assignedNumber : null;
      if (numberEnabled && !numberToUse) {
        const numRes = await fetch("/api/next-number", { method: "POST" });
        const numPayload = (await numRes.json()) as ApiResponse<{
          quotationNumber: string;
          numericValue: number;
        }>;
        if (!numPayload.ok) {
          setSaveNotice({ type: "error", text: numPayload.message });
          setIsSaving(false);
          return;
        }
        numberToUse = numPayload.data.quotationNumber;
        setAssignedNumber(numberToUse);
      }

      // 2. Trigger the PDF builder on the phone with the final number (or null)
      setBuildRequestCounter((prev) => prev + 1);

      // 3. Save or update the quotation in Supabase
      const endpoint = savedQuotationId
        ? `/api/quotations/${savedQuotationId}`
        : "/api/quotations";
      const method = savedQuotationId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quotationNumber: numberToUse,
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
          text: numberToUse
            ? `Saved as ${numberToUse} — PDF ready below.`
            : "Quotation saved to history and PDF ready below.",
        });
      } else {
        setSaveNotice({ type: "error", text: payload.message });
      }
    } catch {
      setBuildRequestCounter((prev) => prev + 1);
      setSaveNotice({
        type: "error",
        text: "Could not save to cloud right now, but your PDF and phone draft are ready.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenErrorBoundary screenName="New Quotation">
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

        <NumberToggle
          enabled={numberEnabled}
          assignedNumber={assignedNumber}
          onChange={setNumberEnabled}
        />

        <TextPaste
          onItemsParsed={handleItemsAdded}
          hasExistingItems={items.length > 0}
        />

        <PhotoPicker
          hasExistingItems={items.length > 0}
          onItemsRead={handleItemsAdded}
        />

        <ItemList items={items} onChange={setItems} />

        <PdfPreview
          buyerName={buyerName}
          buyerAddress={buyerAddress}
          quotationDate={quotationDate}
          quotationNumber={numberEnabled ? assignedNumber : null}
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
    </ScreenErrorBoundary>
  );
}
