// Shared data types for Sultan Quotation Maker.
// All money amounts are stored as whole paise (integers) to avoid rounding mistakes.

export type IconKey =
  | "ball"
  | "net"
  | "dice"
  | "carrom"
  | "chess"
  | "generic";

export interface QuotationItem {
  id: string;
  name: string;
  quantity: number;
  /** Unit price in whole paise (integer). Null when missing and needs user attention. */
  unitPricePaise: number | null;
  /** Optional small note line shown under the item name. */
  note?: string;
  iconKey: IconKey;
  /** True when the reader was unsure and the user should check this row. */
  needsReview?: boolean;
}

export interface Quotation {
  id: string;
  /** Optional quotation number (for example SE-0001). Null when numbering is off. */
  quotationNumber: string | null;
  buyerName: string;
  buyerAddress: string;
  /** ISO date string (YYYY-MM-DD). */
  quotationDate: string;
  items: QuotationItem[];
  /** Grand total in whole paise (integer). */
  totalPaise: number;
  createdAt: string;
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branchCode: string;
}

export interface BusinessSettings {
  companyName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  phoneNumbers: string;
  gstin: string;
  bankDetails: BankDetails;
  signatureStoragePath: string | null;
  /** Transparent PNG data URL loaded by the server from private Supabase Storage. */
  signatureDataUrl?: string | null;
  numberPrefix: string;
  footerSlogan: string;
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };
