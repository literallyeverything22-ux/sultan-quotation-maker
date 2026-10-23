import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/quotation";

export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json(
    {
      ok: false,
      code: "NOT_READY",
      message: "PIN check will be turned on in Phase 1.",
    },
    { status: 501 }
  );
}
