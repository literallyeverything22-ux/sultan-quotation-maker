import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiResponse, Quotation } from "@/types/quotation";
import { requireApiSession } from "@/lib/auth/session";
import {
  getQuotationByIdFromDb,
  updateQuotationInDb,
} from "@/lib/db/supabaseServer";
import { calculateGrandTotalPaise } from "@/lib/money/formatMoney";
import { matchIconKey } from "@/lib/pdf/icons";

const quotationItemInputSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1, "Every item needs a name.").max(250),
  quantity: z.number().int().min(1).max(99999),
  unitPricePaise: z.number().int().min(0).max(999_999_999_00),
  note: z.string().max(250).optional(),
  iconKey: z
    .enum(["ball", "net", "dice", "carrom", "chess", "generic"])
    .optional(),
  needsReview: z.boolean().optional(),
});

const quotationInputSchema = z.object({
  quotationNumber: z.string().max(40).nullable().optional(),
  buyerName: z.string().trim().min(1, "Please enter the buyer name.").max(160),
  buyerAddress: z.string().max(250).default(""),
  quotationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick a valid date."),
  items: z
    .array(quotationItemInputSchema)
    .min(1, "Please add at least one item before saving.")
    .max(200),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Quotation>>> {
  const auth = await requireApiSession<Quotation>("staff");
  if (!auth.allowed) return auth.response;

  try {
    const { id } = await context.params;
    const found = await getQuotationByIdFromDb(id);
    if (!found) {
      return NextResponse.json(
        {
          ok: false,
          code: "QUOTATION_NOT_FOUND",
          message: "Could not find this quotation.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: found,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "QUOTATION_READ_FAILED",
        message: "Could not open this quotation. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Quotation>>> {
  const auth = await requireApiSession<Quotation>("staff");
  if (!auth.allowed) return auth.response;

  try {
    const { id } = await context.params;
    const rawBody: unknown = await request.json().catch(() => null);
    const parsed = quotationInputSchema.safeParse(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message;
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_QUOTATION",
          message:
            firstIssue || "Please check the quotation details and try again.",
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const normalizedItems = input.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      note: item.note?.trim() || undefined,
      iconKey: item.iconKey ?? matchIconKey(item.name),
      needsReview: false,
    }));

    const totalPaise = calculateGrandTotalPaise(normalizedItems);

    const updated = await updateQuotationInDb(id, {
      quotationNumber: input.quotationNumber?.trim() || null,
      buyerName: input.buyerName,
      buyerAddress: input.buyerAddress,
      quotationDate: input.quotationDate,
      items: normalizedItems,
      totalPaise,
    });

    return NextResponse.json({
      ok: true,
      data: updated,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "QUOTATION_UPDATE_FAILED",
        message: "Could not save changes to this quotation. Please try again.",
      },
      { status: 500 }
    );
  }
}
