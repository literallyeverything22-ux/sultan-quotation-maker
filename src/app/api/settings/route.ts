import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/quotation";
import { requireApiSession } from "@/lib/auth/session";

export async function GET(): Promise<NextResponse<ApiResponse<null>>> {
  const auth = await requireApiSession("owner");
  if (!auth.allowed) return auth.response;

  return NextResponse.json(
    {
      ok: false,
      code: "NOT_READY",
      message: "Business settings will be turned on in Phase 2.",
    },
    { status: 501 }
  );
}

export async function PUT(): Promise<NextResponse<ApiResponse<null>>> {
  const auth = await requireApiSession("owner");
  if (!auth.allowed) return auth.response;

  return NextResponse.json(
    {
      ok: false,
      code: "NOT_READY",
      message: "Business settings will be turned on in Phase 2.",
    },
    { status: 501 }
  );
}
