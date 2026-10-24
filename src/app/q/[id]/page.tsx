"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiResponse, Quotation, QuotationItem } from "@/types/quotation";
import { BuyerForm } from "@/components/BuyerForm";
import { ItemList } from "@/components/ItemList";
import { NumberToggle } from "@/components/NumberToggle";
import { PdfPreview } from "@/components/PdfPreview";
import { PhotoPicker } from "@/components/PhotoPicker";
import { TextPaste } from "@/components/TextPaste";
import { TotalBar } from "@/components/TotalBar";
import { createEmptyDraft, saveDraftToPhone } from "@/lib/draft/draftStore";

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function QuotationDetailPage({
  params,
}: QuotationDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerAddress, setBuyerAddress] = useState<string>("");
  const [quotationDate, setQuotationDate] = useState<string>("");
  const [quotationNumber, setQuotationNumber] = useState<string | null>(null);
  const [numberEnabled, setNumberEnabled] = useState<boolean>(false);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [buildRequestCounter, setBuildRequestCounter] = useState<number>(0);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/quotations/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace(`/pin?next=/q/${encodeURIComponent(id)}`);
          return;
        }
        const payload = (await res.json()) as ApiResponse<Quotation>;
        if (!active) return;
        if (payload.ok) {
          setBuyerName(payload.data.buyerName);
          setBuyerAddress(payload.data.buyerAddress);
          setQuotationDate(payload.data.quotationDate);
          setQuotationNumber(payload.data.quotationNumber);
          setNumberEnabled(Boolean(payload.data.quotationNumber));
          setItems(payload.data.items);
        } else {
          setNotice({ type: "error", text: payload.message });
        }
      } catch {
        if (active) {
          setNotice({
            type: "error",
            text: "Could not open this quotation. Please check your connection.",
          });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id, router]);

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
    parsedItems: QuotationItem[],
    mode: "replace" | "append"
  ) => {
    if (mode === "replace") {
      setItems(parsedItems);
    } else {
      setItems((prev) => [...prev, ...parsedItems]);
    }
  };

  const handleSaveAndCreatePdf = async () => {
    setIsSaving(true);
    setNotice(null);

    try {
      let numberToUse: string | null = numberEnabled ? quotationNumber : null;
      if (numberEnabled && !numberToUse) {
        const numRes = await fetch("/api/next-number", { method: "POST" });
        const numPayload = (await numRes.json()) as ApiResponse<{
          quotationNumber: string;
          numericValue: number;
        }>;
        if (!numPayload.ok) {
          setNotice({ type: "error", text: numPayload.message });
          setIsSaving(false);
          return;
        }
        numberToUse = numPayload.data.quotationNumber;
        setQuotationNumber(numberToUse);
      }

      setBuildRequestCounter((prev) => prev + 1);

      const res = await fetch(`/api/quotations/${encodeURIComponent(id)}`, {
        method: "PUT",
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
        setNotice({
          type: "success",
          text: "Changes saved and updated PDF ready below.",
        });
      } else {
        setNotice({ type: "error", text: payload.message });
      }
    } catch {
      setBuildRequestCounter((prev) => prev + 1);
      setNotice({
        type: "error",
        text: "Could not save changes to the cloud right now, but your updated PDF is ready below.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateAsNew = () => {
    const fresh = createEmptyDraft();
    saveDraftToPhone({
      buyerName,
      buyerAddress,
      quotationDate: fresh.quotationDate,
      numberEnabled: false,
      items: items.map((it, idx) => ({
        ...it,
        id: `dup-${Date.now()}-${idx + 1}`,
      })),
    });
    router.push("/new");
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-sultan-lightGrey p-6 text-center text-base font-bold text-sultan-grey">
        Opening saved quotation...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-5">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
              {quotationNumber ? `SAVED • ${quotationNumber}` : "SAVED QUOTATION"}
            </p>
            <h1 className="text-2xl font-bold italic text-sultan-ink">
              Edit Quotation
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDuplicateAsNew}
              className="min-h-[44px] rounded-xl border border-sultan-black bg-sultan-white px-3 text-xs font-bold text-sultan-black active:bg-sultan-lightGrey"
            >
              Duplicate
            </button>
            <Link
              href="/"
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-3 text-sm font-bold text-sultan-black active:bg-sultan-lightGrey"
            >
              Home
            </Link>
          </div>
        </div>

        {notice ? (
          <div
            role="status"
            className={`rounded-xl border-l-4 p-3 text-sm font-bold ${
              notice.type === "error"
                ? "border-sultan-errorRed bg-sultan-lightGrey text-sultan-errorRed"
                : "border-sultan-orange bg-sultan-lightGrey text-sultan-ink"
            }`}
          >
            {notice.text}
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
          assignedNumber={quotationNumber}
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
          quotationNumber={numberEnabled ? quotationNumber : null}
          items={items}
          buildRequestCounter={buildRequestCounter}
        />
      </div>

      <TotalBar
        items={items}
        isBuilding={isSaving}
        onCreatePdf={() => void handleSaveAndCreatePdf()}
      />
    </div>
  );
}
