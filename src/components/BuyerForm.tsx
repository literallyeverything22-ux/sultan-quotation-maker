"use client";

interface BuyerFormProps {
  buyerName: string;
  buyerAddress: string;
  quotationDate: string;
  onChange: (updates: {
    buyerName?: string;
    buyerAddress?: string;
    quotationDate?: string;
  }) => void;
}

export function BuyerForm({
  buyerName,
  buyerAddress,
  quotationDate,
  onChange,
}: BuyerFormProps) {
  return (
    <section className="space-y-4 rounded-xl bg-sultan-lightGrey p-4">
      <div className="flex items-center gap-2">
        <span className="h-5 w-1.5 rounded-full bg-sultan-orange" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
          Billed To (Buyer Details)
        </h2>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">
          Buyer Name
        </span>
        <input
          type="text"
          value={buyerName}
          onChange={(e) => onChange({ buyerName: e.target.value })}
          placeholder="e.g. The Superintendent, Central Prison"
          className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base font-bold text-sultan-ink"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">
          Buyer Address
        </span>
        <textarea
          rows={2}
          value={buyerAddress}
          onChange={(e) => onChange({ buyerAddress: e.target.value })}
          placeholder="City, District, PIN"
          className="w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base text-sultan-ink"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-sultan-grey">
          Quotation Date
        </span>
        <input
          type="date"
          value={quotationDate}
          onChange={(e) => onChange({ quotationDate: e.target.value })}
          className="min-h-[44px] w-full rounded-xl border border-sultan-lineGrey bg-sultan-white px-3 py-2 text-base font-bold text-sultan-ink"
        />
      </label>
    </section>
  );
}
