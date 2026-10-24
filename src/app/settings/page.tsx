"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiResponse, BusinessSettings } from "@/types/quotation";
import { ScreenErrorBoundary } from "@/components/BuyerForm";
import { prepareSignatureImage } from "@/lib/image/shrinkPhoto";

const EMPTY_SETTINGS: BusinessSettings = {
  companyName: "",
  tagline: "",
  addressLine1: "",
  addressLine2: "",
  phoneNumbers: "",
  gstin: "",
  bankDetails: { bankName: "", accountHolder: "", accountNumber: "", ifscCode: "", branchCode: "" },
  signatureStoragePath: null,
  signatureDataUrl: null,
  numberPrefix: "SE",
  footerSlogan: "PLAY HARD. PLAY FAIR.",
};

const COMPANY_FIELDS = [
  ["companyName", "Company Name", "Company name shown on header"],
  ["tagline", "Tagline", "e.g. Sports Goods | Indoor Games | Equipment"],
  ["addressLine1", "Address Line 1", "Street / Shop address"],
  ["addressLine2", "Address Line 2", "City, State, PIN"],
  ["phoneNumbers", "Phone Numbers", "Phone numbers shown on quotation"],
  ["gstin", "GSTIN", "GSTIN number"],
] as const;

const BANK_FIELDS = [
  ["bankName", "Bank Name", "Bank name"],
  ["accountHolder", "A/C Holder", "Account holder name"],
  ["accountNumber", "A/C Number", "Bank account number"],
  ["ifscCode", "IFSC Code", "IFSC code"],
  ["branchCode", "Branch Code", "Branch name or code"],
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<BusinessSettings>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [newSignatureDataUrl, setNewSignatureDataUrl] = useState<string | undefined>(undefined);
  const [clearSignature, setClearSignature] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(205);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/settings?ownerOnly=1", { cache: "no-store" });
        if (res.status === 401 || res.status === 403) {
          router.replace("/pin?mode=owner&next=/settings");
          return;
        }
        const payload = (await res.json()) as ApiResponse<BusinessSettings>;
        if (!active) return;
        if (!payload.ok) {
          setNotice({ type: "error", text: payload.message });
        } else {
          setForm(payload.data);
        }
      } catch {
        if (active) setNotice({ type: "error", text: "Could not load business settings. Please try again." });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const processSignatureFile = useCallback(async (file: File, cutoff: number) => {
    setIsProcessingImage(true);
    setNotice(null);
    try {
      const cleanedDataUrl = await prepareSignatureImage(file, cutoff);
      setNewSignatureDataUrl(cleanedDataUrl);
      setClearSignature(false);
    } catch {
      setNotice({ type: "error", text: "Could not read this signature image. Try a clearer photo." });
    } finally {
      setIsProcessingImage(false);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    void processSignatureFile(file, sensitivity);
  };

  const handleSensitivityChange = (newCutoff: number) => {
    setSensitivity(newCutoff);
    if (selectedFile) void processSignatureFile(selectedFile, newCutoff);
  };

  const handleRemoveSignature = () => {
    setSelectedFile(null);
    setNewSignatureDataUrl(undefined);
    setClearSignature(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          newSignatureDataUrl,
          clearSignature,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        router.replace("/pin?mode=owner&next=/settings");
        return;
      }
      const payload = (await res.json()) as ApiResponse<BusinessSettings>;
      if (!payload.ok) {
        setNotice({ type: "error", text: payload.message });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setForm(payload.data);
      setNewSignatureDataUrl(undefined);
      setClearSignature(false);
      setSelectedFile(null);
      setNotice({ type: "success", text: "Business settings saved." });
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setNotice({ type: "error", text: "Something went wrong while saving. Please try again." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  const previewUrl = clearSignature ? null : newSignatureDataUrl ?? form.signatureDataUrl ?? null;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <p className="text-base font-bold text-sultan-grey">Loading business settings...</p>
      </div>
    );
  }

  return (
    <ScreenErrorBoundary screenName="Business Settings">
      <form onSubmit={handleSave} className="flex flex-1 flex-col gap-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">OWNER ONLY</p>
            <h1 className="text-2xl font-bold italic text-sultan-ink">Business Settings</h1>
          </div>
          <Link href="/" className="flex min-h-[44px] items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-3 text-sm font-bold text-sultan-black active:bg-sultan-lightGrey">
            Back
          </Link>
        </div>

        {notice ? (
          <div role="alert" className={`rounded-xl border-l-4 bg-sultan-lightGrey p-4 ${notice.type === "error" ? "border-sultan-errorRed text-sultan-errorRed" : "border-sultan-orange text-sultan-ink"}`}>
            <p className="text-base font-bold">{notice.text}</p>
          </div>
        ) : null}

        <section className="space-y-4 rounded-xl bg-sultan-lightGrey p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sultan-orange">1. Company Details (PDF Header)</h2>
          {COMPANY_FIELDS.map(([field, label, placeholder]) => (
            <label key={field} className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">{label}</span>
              <input type="text" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={placeholder} className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base text-sultan-ink" />
            </label>
          ))}
        </section>

        <section className="space-y-4 rounded-xl bg-sultan-lightGrey p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sultan-orange">2. Bank Details (PDF Card)</h2>
          {BANK_FIELDS.map(([field, label, placeholder]) => (
            <label key={field} className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">{label}</span>
              <input type="text" value={form.bankDetails[field]} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, [field]: e.target.value } })} placeholder={placeholder} className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base text-sultan-ink" />
            </label>
          ))}
        </section>

        <section className="space-y-4 rounded-xl bg-sultan-lightGrey p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sultan-orange">3. Numbering & Footer Line</h2>
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">Quotation Number Prefix</span>
            <input type="text" value={form.numberPrefix} onChange={(e) => setForm({ ...form, numberPrefix: e.target.value.toUpperCase() })} placeholder="SE" className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base uppercase text-sultan-ink" />
            <span className="block text-xs text-sultan-grey">Example: {form.numberPrefix || "SE"}-0001</span>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">Footer Slogan Line</span>
            <input type="text" value={form.footerSlogan} onChange={(e) => setForm({ ...form, footerSlogan: e.target.value })} placeholder="PLAY HARD. PLAY FAIR." className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base text-sultan-ink" />
          </label>
        </section>

        <section className="space-y-4 rounded-xl bg-sultan-lightGrey p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sultan-orange">4. Signature & Stamp Image</h2>
          <p className="text-sm text-sultan-grey">
            Upload a photo of your signature and stamp on white paper. The app removes the paper background so it sits cleanly on white.
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-4 py-2 text-base font-bold text-sultan-black active:bg-sultan-lightGrey">
              {previewUrl ? "Change Signature Photo" : "Upload Signature Photo"}
            </button>
            {previewUrl ? (
              <button type="button" onClick={handleRemoveSignature} className="flex min-h-[48px] items-center justify-center rounded-xl border border-sultan-errorRed bg-sultan-white px-4 py-2 text-sm font-bold text-sultan-errorRed">
                Remove
              </button>
            ) : null}
          </div>

          {selectedFile ? (
            <label className="block space-y-1 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">Paper Removal Strength ({sensitivity})</span>
              <input type="range" min={150} max={240} value={sensitivity} onChange={(e) => handleSensitivityChange(Number(e.target.value))} className="h-8 w-full accent-sultan-orange" />
            </label>
          ) : null}

          {isProcessingImage ? (
            <div className="rounded-xl bg-sultan-white p-4 text-center text-sm font-bold text-sultan-orange">Removing paper background...</div>
          ) : previewUrl ? (
            <div className="space-y-2 rounded-xl border border-sultan-lineGrey bg-sultan-white p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-sultan-grey">Clean Preview on White PDF Page</p>
              <div className="mx-auto flex min-h-[96px] max-w-[220px] items-center justify-center py-2">
                <img src={previewUrl} alt="Cleaned signature and stamp preview" className="max-h-28 w-auto object-contain" />
              </div>
              <div className="mx-auto w-48 border-t border-sultan-lineGrey pt-1 text-xs text-sultan-grey">Authorised Signatory</div>
            </div>
          ) : null}
        </section>

        <div className="sticky bottom-4 pt-2">
          <button type="submit" disabled={isSaving || isProcessingImage} className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sultan-orange px-4 py-3 text-base font-bold text-sultan-black active:opacity-90 disabled:opacity-50">
            {isSaving ? "Saving Settings..." : "Save Business Settings"}
          </button>
        </div>
      </form>
    </ScreenErrorBoundary>
  );
}
