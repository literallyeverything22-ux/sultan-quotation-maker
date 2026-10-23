import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/quotation";

export async function GET(): Promise<NextResponse<ApiResponse<null>>> {
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
  return NextResponse.json(
    {
      ok: false,
      code: "NOT_READY",
      message: "Business settings will be turned on in Phase 2.",
    },
    { status: 501 }
  );
}
