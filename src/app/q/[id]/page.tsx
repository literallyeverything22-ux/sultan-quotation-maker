import Link from "next/link";
import { requirePageSession } from "@/lib/auth/session";

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotationDetailPage({
  params,
}: QuotationDetailPageProps) {
  const { id } = await params;
  await requirePageSession("staff", `/q/${id}`);

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
          SAVED QUOTATION
        </p>
        <h1 className="text-2xl font-bold italic text-sultan-ink">
          Quotation #{id}
        </h1>
        <p className="text-base text-sultan-grey">
          Opening and editing saved quotations will be connected in Phase 7.
        </p>
      </div>
      <Link
        href="/"
        className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-4 py-3 text-base font-bold text-sultan-black"
      >
        Back to Home
      </Link>
    </div>
  );
}
