// Phone local draft auto-save store (Architecture.md section 4.3 & Phases.md Phase 4 Task 8).
// Saves every change to localStorage on the phone so a dropped connection or closed browser never loses work.

import type { QuotationItem } from "@/types/quotation";

const DRAFT_STORAGE_KEY = "sultan_quotation_draft_v1";

export interface QuotationDraft {
  buyerName: string;
  buyerAddress: string;
  quotationDate: string;
  numberEnabled: boolean;
  items: QuotationItem[];
  updatedAt: string;
}

/**
 * Returns today's date in YYYY-MM-DD local format.
 */
export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createEmptyDraft(): QuotationDraft {
  return {
    buyerName: "",
    buyerAddress: "",
    quotationDate: getTodayIsoDate(),
    numberEnabled: false,
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Loads the saved quotation draft from the phone's browser storage.
 */
export function loadDraftFromPhone(): QuotationDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuotationDraft>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      buyerName: typeof parsed.buyerName === "string" ? parsed.buyerName : "",
      buyerAddress:
        typeof parsed.buyerAddress === "string" ? parsed.buyerAddress : "",
      quotationDate:
        typeof parsed.quotationDate === "string" && parsed.quotationDate
          ? parsed.quotationDate
          : getTodayIsoDate(),
      numberEnabled: Boolean(parsed.numberEnabled),
      items: Array.isArray(parsed.items) ? parsed.items : [],
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Saves the current quotation draft to the phone's browser storage.
 */
export function saveDraftToPhone(draft: Omit<QuotationDraft, "updatedAt">): void {
  if (typeof window === "undefined") return;

  try {
    const payload: QuotationDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors so editing never crashes
  }
}

/**
 * Clears the draft from the phone's browser storage when the user resets the quotation.
 */
export function clearDraftFromPhone(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}
