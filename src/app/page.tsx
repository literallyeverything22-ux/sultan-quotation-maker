import Link from "next/link";
import { requirePageSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await requirePageSession("staff", "/");

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sultan-orange">
              {session.role === "owner" ? "OWNER ACCESS" : "STAFF ACCESS"}
            </p>
            <h1 className="text-2xl font-bold italic text-sultan-ink">
              Saved Quotations
            </h1>
          </div>
          <Link
            href="/settings"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-sultan-black bg-sultan-white px-3 text-sm font-bold text-sultan-black active:bg-sultan-lightGrey"
          >
            Settings
          </Link>
        </div>

        <div className="rounded-xl bg-sultan-lightGrey p-4">
          <p className="text-base font-bold text-sultan-ink">
            PIN verified — Welcome to Quotation Maker.
          </p>
          <p className="mt-1 text-base text-sultan-grey">
            Your saved quotations will appear here as cards sorted from newest
            to oldest. Tap the orange button below to start a new quotation.
          </p>
        </div>
      </section>

      <div className="sticky bottom-4 pt-2">
        <Link
          href="/new"
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sultan-orange px-4 py-3 text-base font-bold text-sultan-black active:opacity-90"
        >
          + New Quotation
        </Link>
      </div>
    </div>
  );
}
