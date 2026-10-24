import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiResponse, BusinessSettings } from "@/types/quotation";
import { requireApiSession } from "@/lib/auth/session";
import {
  getBusinessSettings,
  saveBusinessSettings,
  uploadSignaturePngDataUrl,
} from "@/lib/db/supabaseServer";

const settingsInputSchema = z.object({
  companyName: z.string().max(120),
  tagline: z.string().max(160),
  addressLine1: z.string().max(200),
  addressLine2: z.string().max(200),
  phoneNumbers: z.string().max(120),
  gstin: z.string().max(40),
  bankDetails: z.object({
    bankName: z.string().max(120),
    accountHolder: z.string().max(120),
    accountNumber: z.string().max(60),
    ifscCode: z.string().max(40),
    branchCode: z.string().max(60),
  }),
  numberPrefix: z
    .string()
    .trim()
    .min(1, "Please enter a quotation number prefix (for example SE).")
    .max(12),
  footerSlogan: z.string().max(120),
  /** Optional new transparent PNG data URL when the owner uploads a new signature/stamp. */
  newSignatureDataUrl: z
    .string()
    .startsWith("data:image/png;base64,")
    .max(3_000_000)
    .optional(),
  /** True when the owner wants to remove the saved signature image. */
  clearSignature: z.boolean().optional(),
});

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse<BusinessSettings>>> {
  const url = new URL(request.url);
  const ownerOnly = url.searchParams.get("ownerOnly") === "1";
  const auth = await requireApiSession<BusinessSettings>(
    ownerOnly ? "owner" : "staff"
  );
  if (!auth.allowed) return auth.response;

  try {
    const settings = await getBusinessSettings();
    return NextResponse.json({
      ok: true,
      data: settings,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SETTINGS_READ_FAILED",
        message: "Could not load business settings. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request
): Promise<NextResponse<ApiResponse<BusinessSettings>>> {
  const auth = await requireApiSession<BusinessSettings>("owner");
  if (!auth.allowed) return auth.response;

  try {
    const rawBody: unknown = await request.json().catch(() => null);
    const parsed = settingsInputSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message;
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_INPUT",
          message:
            firstIssue || "Please check the settings fields and try again.",
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const current = await getBusinessSettings();

    let signatureStoragePath = current.signatureStoragePath;
    if (input.clearSignature) {
      signatureStoragePath = null;
    } else if (input.newSignatureDataUrl) {
      signatureStoragePath = await uploadSignaturePngDataUrl(
        input.newSignatureDataUrl
      );
    }

    const saved = await saveBusinessSettings({
      companyName: input.companyName,
      tagline: input.tagline,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      phoneNumbers: input.phoneNumbers,
      gstin: input.gstin,
      bankDetails: input.bankDetails,
      signatureStoragePath,
      numberPrefix: input.numberPrefix,
      footerSlogan: input.footerSlogan,
    });

    return NextResponse.json({
      ok: true,
      data: saved,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SETTINGS_SAVE_FAILED",
        message: "Could not save business settings. Please try again.",
      },
      { status: 500 }
    );
  }
}
