import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/quotation";
import { requireApiSession } from "@/lib/auth/session";
import {
  getAuthHeaders,
  getBusinessSettings,
  getSupabaseConfig,
} from "@/lib/db/supabaseServer";

interface CounterRow {
  name: string;
  last_value: number;
}

interface NextNumberResponse {
  quotationNumber: string;
  numericValue: number;
}

function formatQuotationNumber(prefix: string, num: number): string {
  const cleanPrefix = (prefix || "SE").trim().toUpperCase();
  const padded = String(Math.max(1, num)).padStart(4, "0");
  return `${cleanPrefix}-${padded}`;
}

/**
 * GET /api/next-number
 * Previews what the next quotation number will look like (e.g. "SE-0001")
 * WITHOUT claiming or incrementing the counter.
 */
export async function GET(): Promise<
  NextResponse<ApiResponse<NextNumberResponse>>
> {
  const auth = await requireApiSession<NextNumberResponse>("staff");
  if (!auth.allowed) return auth.response;

  try {
    const { baseUrl, serviceKey } = getSupabaseConfig();
    const [settings, counterRes] = await Promise.all([
      getBusinessSettings(),
      fetch(
        `${baseUrl}/rest/v1/counters?name=eq.quotation_number&select=name,last_value`,
        {
          headers: getAuthHeaders(serviceKey),
          cache: "no-store",
        }
      ),
    ]);

    let lastVal = 0;
    if (counterRes.ok) {
      const rows = (await counterRes.json()) as CounterRow[];
      lastVal = Number(rows[0]?.last_value ?? 0);
    }

    const nextVal = lastVal + 1;
    return NextResponse.json({
      ok: true,
      data: {
        quotationNumber: formatQuotationNumber(settings.numberPrefix, nextVal),
        numericValue: nextVal,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "NUMBER_PREVIEW_FAILED",
        message: "Could not preview the next quotation number.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/next-number
 * Atomically claims the next quotation number using claim_next_quotation_number() in Supabase.
 * Even if two staff phones tap Create PDF at the exact same moment, each gets a unique number.
 */
export async function POST(): Promise<
  NextResponse<ApiResponse<NextNumberResponse>>
> {
  const auth = await requireApiSession<NextNumberResponse>("staff");
  if (!auth.allowed) return auth.response;

  try {
    const { baseUrl, serviceKey } = getSupabaseConfig();
    const [settings, rpcRes] = await Promise.all([
      getBusinessSettings(),
      fetch(`${baseUrl}/rest/v1/rpc/claim_next_quotation_number`, {
        method: "POST",
        headers: getAuthHeaders(serviceKey, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({}),
      }),
    ]);

    if (!rpcRes.ok) {
      throw new Error("Could not claim next quotation number.");
    }

    const rawNext = (await rpcRes.json()) as number | string;
    const numericValue = Number(rawNext);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      throw new Error("Invalid counter value returned.");
    }

    return NextResponse.json({
      ok: true,
      data: {
        quotationNumber: formatQuotationNumber(
          settings.numberPrefix,
          numericValue
        ),
        numericValue,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "NUMBER_CLAIM_FAILED",
        message: "Could not assign a quotation number. Please try again.",
      },
      { status: 500 }
    );
  }
}
