import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/quotation";
import { requireApiSession } from "@/lib/auth/session";

export async function GET(): Promise<NextResponse<ApiResponse<null>>> {
  const auth = await requireApiSession("staff");
  if (!auth.allowed) return auth.response;

  return NextResponse.json(
    {
      ok: false,
      code: "NOT_READY",
      message: "Opening saved quotations will be turned on in Phase 7.",
    },
    { status: 501 }
  );
}

export async function PUT(): Promise<NextResponse<ApiResponse<null>>> {
  const auth = await requireApiSession("staff");
  if (!auth.allowed) return auth.response;

  return NextResponse.json(
    {
      ok: false,
      code: "NOT_READY",
      message: "Updating quotations will be turned on in Phase 7.",
    },
    { status: 501 }
  );
}
