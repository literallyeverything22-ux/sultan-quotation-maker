import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/quotation";
import { requireApiSession } from "@/lib/auth/session";

export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  const auth = await requireApiSession("staff");
  if (!auth.allowed) return auth.response;

  return NextResponse.json(
    {
      ok: false,
      code: "NOT_READY",
      message: "Quotation numbering will be turned on in Phase 8.",
    },
    { status: 501 }
  );
}
