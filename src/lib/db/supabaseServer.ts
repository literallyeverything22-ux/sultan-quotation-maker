// Server-only Supabase database and private storage helper.
// Uses SUPABASE_URL and SUPABASE_SERVICE_KEY on the server only. Never import in client components.

import type { BusinessSettings } from "@/types/quotation";

const SIGNATURE_BUCKET = "signatures";
const SIGNATURE_OBJECT_PATH = "owner-signature.png";

interface SettingsRow {
  id: number;
  company_name: string;
  tagline: string;
  address_line1: string;
  address_line2: string;
  phone_numbers: string;
  gstin: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  branch_code: string;
  signature_storage_path: string | null;
  number_prefix: string;
  footer_slogan: string;
}

function getSupabaseConfig(): { baseUrl: string; serviceKey: string } {
  const baseUrl = (process.env.SUPABASE_URL ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/$/, "");
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  if (!baseUrl || !serviceKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  return { baseUrl, serviceKey };
}

function getAuthHeaders(
  serviceKey: string,
  extra?: Record<string, string>
): Record<string, string> {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...extra,
  };
}

/**
 * Ensures the private "signatures" bucket exists in Supabase Storage before uploading.
 */
async function ensureSignatureBucket(
  baseUrl: string,
  serviceKey: string
): Promise<void> {
  const checkRes = await fetch(
    `${baseUrl}/storage/v1/bucket/${SIGNATURE_BUCKET}`,
    {
      headers: getAuthHeaders(serviceKey),
      cache: "no-store",
    }
  );

  if (checkRes.status === 404 || checkRes.status === 400) {
    await fetch(`${baseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers: getAuthHeaders(serviceKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        id: SIGNATURE_BUCKET,
        name: SIGNATURE_BUCKET,
        public: false,
      }),
    });
  }
}

/**
 * Downloads the stored signature PNG from private Supabase Storage and returns a data URL.
 */
async function fetchSignatureDataUrl(
  baseUrl: string,
  serviceKey: string,
  storagePath: string | null
): Promise<string | null> {
  if (!storagePath) return null;

  try {
    const res = await fetch(
      `${baseUrl}/storage/v1/object/${SIGNATURE_BUCKET}/${encodeURIComponent(
        storagePath
      )}`,
      {
        headers: getAuthHeaders(serviceKey),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Uploads a transparent PNG data URL ("data:image/png;base64,...") to private Supabase Storage.
 */
export async function uploadSignaturePngDataUrl(
  dataUrl: string
): Promise<string> {
  const { baseUrl, serviceKey } = getSupabaseConfig();
  await ensureSignatureBucket(baseUrl, serviceKey);

  const prefix = "data:image/png;base64,";
  const base64Part = dataUrl.startsWith(prefix)
    ? dataUrl.slice(prefix.length)
    : dataUrl;
  const pngBytes = Buffer.from(base64Part, "base64");

  const uploadRes = await fetch(
    `${baseUrl}/storage/v1/object/${SIGNATURE_BUCKET}/${SIGNATURE_OBJECT_PATH}`,
    {
      method: "POST",
      headers: getAuthHeaders(serviceKey, {
        "Content-Type": "image/png",
        "x-upsert": "true",
      }),
      body: pngBytes,
    }
  );

  if (!uploadRes.ok) {
    throw new Error("Could not save signature image to storage.");
  }

  return SIGNATURE_OBJECT_PATH;
}

function mapRowToSettings(
  row: SettingsRow,
  signatureDataUrl: string | null
): BusinessSettings {
  return {
    companyName: row.company_name ?? "",
    tagline: row.tagline ?? "",
    addressLine1: row.address_line1 ?? "",
    addressLine2: row.address_line2 ?? "",
    phoneNumbers: row.phone_numbers ?? "",
    gstin: row.gstin ?? "",
    bankDetails: {
      bankName: row.bank_name ?? "",
      accountHolder: row.account_holder ?? "",
      accountNumber: row.account_number ?? "",
      ifscCode: row.ifsc_code ?? "",
      branchCode: row.branch_code ?? "",
    },
    signatureStoragePath: row.signature_storage_path ?? null,
    signatureDataUrl,
    numberPrefix: row.number_prefix || "SE",
    footerSlogan: row.footer_slogan || "PLAY HARD. PLAY FAIR.",
  };
}

/**
 * Reads the single settings row (id = 1) from Supabase and loads the signature preview if stored.
 */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const { baseUrl, serviceKey } = getSupabaseConfig();

  const res = await fetch(
    `${baseUrl}/rest/v1/settings?id=eq.1&select=*`,
    {
      headers: getAuthHeaders(serviceKey),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Could not read business settings.");
  }

  const rows = (await res.json()) as SettingsRow[];
  const row = rows[0];

  if (!row) {
    // Ensure the default row exists
    const insertRes = await fetch(`${baseUrl}/rest/v1/settings`, {
      method: "POST",
      headers: getAuthHeaders(serviceKey, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify({ id: 1 }),
    });
    if (!insertRes.ok) {
      throw new Error("Could not initialize business settings.");
    }
    const createdRows = (await insertRes.json()) as SettingsRow[];
    const created = createdRows[0];
    if (!created) {
      throw new Error("Could not initialize business settings.");
    }
    return mapRowToSettings(created, null);
  }

  const signatureDataUrl = await fetchSignatureDataUrl(
    baseUrl,
    serviceKey,
    row.signature_storage_path
  );

  return mapRowToSettings(row, signatureDataUrl);
}

/**
 * Saves the single settings row (id = 1) in Supabase.
 */
export async function saveBusinessSettings(
  input: Omit<BusinessSettings, "signatureDataUrl">
): Promise<BusinessSettings> {
  const { baseUrl, serviceKey } = getSupabaseConfig();

  const payload = {
    id: 1,
    company_name: input.companyName.trim(),
    tagline: input.tagline.trim(),
    address_line1: input.addressLine1.trim(),
    address_line2: input.addressLine2.trim(),
    phone_numbers: input.phoneNumbers.trim(),
    gstin: input.gstin.trim(),
    bank_name: input.bankDetails.bankName.trim(),
    account_holder: input.bankDetails.accountHolder.trim(),
    account_number: input.bankDetails.accountNumber.trim(),
    ifsc_code: input.bankDetails.ifscCode.trim(),
    branch_code: input.bankDetails.branchCode.trim(),
    signature_storage_path: input.signatureStoragePath,
    number_prefix: input.numberPrefix.trim() || "SE",
    footer_slogan: input.footerSlogan.trim() || "PLAY HARD. PLAY FAIR.",
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(`${baseUrl}/rest/v1/settings`, {
    method: "POST",
    headers: getAuthHeaders(serviceKey, {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Could not save business settings.");
  }

  const rows = (await res.json()) as SettingsRow[];
  const updatedRow = rows[0];
  if (!updatedRow) {
    throw new Error("Could not save business settings.");
  }

  const signatureDataUrl = await fetchSignatureDataUrl(
    baseUrl,
    serviceKey,
    updatedRow.signature_storage_path
  );

  return mapRowToSettings(updatedRow, signatureDataUrl);
}
