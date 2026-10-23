import Link from "next/link";

export default function PinPage() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
          ACCESS
        </p>
        <h1 className="text-2xl font-bold italic text-sultan-ink">Enter PIN</h1>
        <p className="text-base text-sultan-grey">
          PIN protection will be enabled in Phase 1.
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
