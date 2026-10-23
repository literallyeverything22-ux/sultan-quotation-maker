import Link from "next/link";

export default function NewQuotationPage() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
          NEW QUOTATION
        </p>
        <h1 className="text-2xl font-bold italic text-sultan-ink">
          New Quotation
        </h1>
        <p className="text-base text-sultan-grey">
          Buyer details and item entry will be connected in Phase 4.
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
