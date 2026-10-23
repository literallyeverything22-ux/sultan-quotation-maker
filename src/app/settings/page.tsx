import Link from "next/link";
import { requirePageSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  await requirePageSession("owner", "/settings");

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
          OWNER ONLY — UNLOCKED
        </p>
        <h1 className="text-2xl font-bold italic text-sultan-ink">
          Business Settings
        </h1>
        <p className="text-base text-sultan-grey">
          Business details, bank details, and signature upload will be added in
          Phase 2.
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
