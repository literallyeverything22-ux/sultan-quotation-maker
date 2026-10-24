import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiResponse, QuotationItem } from "@/types/quotation";
import { requireApiSession } from "@/lib/auth/session";
import {
  AiReadError,
  readItemsFromImageOrText,
} from "@/lib/ai/readItemsFromImage";

const readItemsRequestSchema = z
  .object({
    imageDataUrl: z.string().max(8_000_000).optional(),
    messyText: z.string().max(50_000).optional(),
  })
  .refine(
    (val) => Boolean(val.imageDataUrl?.trim() || val.messyText?.trim()),
    "Please select a photo or enter text to read."
  );

interface ReadItemsResponse {
  items: QuotationItem[];
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<ReadItemsResponse>>> {
  const auth = await requireApiSession<ReadItemsResponse>("staff");
  if (!auth.allowed) return auth.response;

  try {
    const rawBody: unknown = await request.json().catch(() => null);
    const parsed = readItemsRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_INPUT",
          message:
            "Could not read this photo clearly. Try a brighter, closer photo, or type the items instead.",
        },
        { status: 400 }
      );
    }

    const items = await readItemsFromImageOrText(parsed.data);

    return NextResponse.json({
      ok: true,
      data: { items },
    });
  } catch (err) {
    if (err instanceof AiReadError) {
      const status =
        err.code === "DAILY_LIMIT"
          ? 429
          : err.code === "UNCLEAR_PHOTO"
            ? 422
            : 500;
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: err.message,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "BROKEN_REPLY",
        message: "Something went wrong reading the photo. Please try again.",
      },
      { status: 500 }
    );
  }
}
