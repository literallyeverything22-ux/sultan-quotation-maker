import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/quotation";

export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json(
    {
      ok: false,
      code: "NOT_READY",
      message: "Quotation numbering will be turned on in Phase 8.",
    },
    { status: 501 }
  );
}
