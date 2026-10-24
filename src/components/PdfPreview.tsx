"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, BusinessSettings, QuotationItem } from "@/types/quotation";
import { buildQuotationPdf } from "@/lib/pdf/buildQuotationPdf";
import {
  buildSampleQuotationItems,
  DEFAULT_BUSINESS_SETTINGS,
} from "@/lib/pdf/theme";

interface PdfPreviewProps {
  buyerName: string;
  buyerAddress: string;
  quotationDate: string;
  quotationNumber?: string | null;
  items: ReadonlyArray<QuotationItem>;
  /** Triggered when the user taps "Create PDF" from the bottom total bar. */
  buildRequestCounter: number;
}

const SAMPLE_COUNTS = [1, 5, 14, 15, 50, 100] as const;

export function PdfPreview({
  buyerName,
  buyerAddress,
  quotationDate,
  quotationNumber,
  items,
  buildRequestCounter,
}: PdfPreviewProps) {
  const [settings, setSettings] = useState<BusinessSettings>(
    DEFAULT_BUSINESS_SETTINGS
  );
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [progressLabel, setProgressLabel] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("Quotation.pdf");
  const [showSampleTester, setShowSampleTester] = useState<boolean>(false);

  // Load business settings (including signature image) once on mount
  useEffect(() => {
    let active = true;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json() as Promise<ApiResponse<BusinessSettings>>)
      .then((payload) => {
        if (active && payload.ok) {
          setSettings(payload.data);
        }
      })
      .catch(() => {
        // Keep DEFAULT_BUSINESS_SETTINGS if offline
      });
    return () => {
      active = false;
    };
  }, []);

  // Clean up blob URL when replaced or unmounted
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const generatePdf = async (
    targetBuyerName: string,
    targetBuyerAddress: string,
    targetDate: string,
    targetNumber: string | null | undefined,
    targetItems: ReadonlyArray<QuotationItem>,
    fileNameLabel: string
  ) => {
    setIsBuilding(true);
    setErrorMessage(null);
    setProgressLabel(`Drawing sporty PDF (${targetItems.length} items)...`);

    try {
      const bytes = await buildQuotationPdf({
        buyerName: targetBuyerName,
        buyerAddress: targetBuyerAddress,
        quotationDate: targetDate,
        quotationNumber: targetNumber,
        items: targetItems,
        settings,
      });

      const safeBytes = new Uint8Array(bytes.byteLength);
      safeBytes.set(bytes);
      const blob = new Blob([safeBytes.buffer], { type: "application/pdf" });
      const nextUrl = URL.createObjectURL(blob);

      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      setPdfBytes(safeBytes);
      setPdfFileName(fileNameLabel);
    } catch {
      setErrorMessage("Could not create the PDF. Please try again.");
    } finally {
      setIsBuilding(false);
      setProgressLabel("");
    }
  };

  // Build from the user's current list whenever buildRequestCounter increments
  useEffect(() => {
    if (buildRequestCounter === 0 || items.length === 0) return;
    const cleanBuyer = (buyerName || "Customer")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 32);
    void generatePdf(
      buyerName || "The Superintendent",
      buyerAddress || "Kadapa",
      quotationDate,
      quotationNumber,
      items,
      `Quotation_${cleanBuyer}.pdf`
    );
  }, [buildRequestCounter]);

  const handleSampleBuild = (count: number) => {
    const sampleItems = buildSampleQuotationItems(count);
    void generatePdf(
      "The Superintendent",
      "Central Prison, Kadapa.",
      "2026-10-22",
      count === 5 ? null : "SE-0001",
      sampleItems,
      `Sample_Quotation_${count}_Items.pdf`
    );
  };

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    const link = document.createElement("a");
    link.href = pdfBlobUrl;
    link.download = pdfFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!pdfBytes) return;
    const copy = new Uint8Array(pdfBytes.byteLength);
    copy.set(pdfBytes);
    const file = new File([copy.buffer], pdfFileName, {
      type: "application/pdf",
    });

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: pdfFileName,
          text: `Quotation from ${settings.companyName}`,
        });
        return;
      } catch {
        // User cancelled or share failed; fall back to download
      }
    }
    handleDownload();
  };

  return (
    <section className="space-y-3 rounded-xl border border-sultan-lineGrey bg-sultan-lightGrey p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
            SPORTY PDF ENGINE
          </span>
          <h2 className="text-base font-bold italic text-sultan-ink">
            PDF Preview &amp; Sample Test Bench
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowSampleTester((prev) => !prev)}
          className="min-h-[40px] rounded-xl border border-sultan-black bg-sultan-white px-3 text-xs font-bold text-sultan-black"
        >
          {showSampleTester ? "Hide Test Samples" : "Test Samples (1–100)"}
        </button>
      </div>

      {showSampleTester ? (
        <div className="space-y-2 rounded-xl border border-sultan-lineGrey bg-sultan-white p-3">
          <p className="text-xs text-sultan-grey">
            Tap any count below to build and test a sample sporty PDF on your
            phone (<strong>5 Items</strong> matches the approved Central Prison,
            Kadapa reference PDF):
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SAMPLE_COUNTS.map((cnt) => (
              <button
                key={cnt}
                type="button"
                disabled={isBuilding}
                onClick={() => handleSampleBuild(cnt)}
                className="min-h-[44px] rounded-xl border border-sultan-black bg-sultan-lightGrey px-2 text-xs font-bold text-sultan-black active:bg-sultan-orange disabled:opacity-50"
              >
                {cnt} {cnt === 1 ? "Item" : "Items"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isBuilding ? (
        <div className="space-y-2 rounded-xl bg-sultan-white p-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-sultan-lightGrey">
            <div className="h-full w-3/4 animate-pulse rounded-full bg-sultan-orange" />
          </div>
          <p className="text-xs font-bold text-sultan-ink">{progressLabel}</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border-l-4 border-sultan-errorRed bg-sultan-white p-3 text-sm font-bold text-sultan-errorRed"
        >
          {errorMessage}
        </div>
      ) : null}

      {pdfBlobUrl ? (
        <div className="space-y-3 rounded-xl border border-sultan-lineGrey bg-sultan-white p-3">
          <div className="flex items-center justify-between">
            <span className="truncate text-xs font-bold text-sultan-ink">
              Ready: {pdfFileName}
            </span>
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-sultan-orange underline"
            >
              Open Full Screen
            </a>
          </div>

          <iframe
            src={pdfBlobUrl}
            title="Quotation PDF Preview"
            className="h-80 w-full rounded-lg border border-sultan-lineGrey bg-sultan-lightGrey"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="min-h-[48px] rounded-xl border border-sultan-black bg-sultan-white px-3 text-sm font-bold text-sultan-black"
            >
              Save to Phone
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="min-h-[48px] rounded-xl bg-sultan-orange px-3 text-sm font-bold text-sultan-black"
            >
              Share PDF
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
