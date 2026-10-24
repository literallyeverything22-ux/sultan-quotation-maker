import type { Metadata, Viewport } from "next";
import { getBusinessSettings } from "@/lib/db/supabaseServer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quotation Maker",
  description: "Phone-friendly sporty quotation maker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quotations",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121317",
  viewportFit: "cover",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  let headerTitle = "QUOTATION MAKER";
  try {
    const settings = await getBusinessSettings();
    if (settings.companyName.trim()) {
      headerTitle = settings.companyName.trim().toUpperCase();
    }
  } catch {
    // Fallback to default header title if database is unreachable
  }

  return (
    <html lang="en">
      <body className="bg-sultan-white text-sultan-ink antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-sultan-white">
          <header className="relative flex h-14 items-center justify-between overflow-hidden border-b-4 border-sultan-orange bg-sultan-black px-4">
            <span className="z-10 truncate pr-24 text-lg font-bold italic tracking-wide text-sultan-white">
              {headerTitle}
            </span>
            {/* Sporty orange diagonal slash echoing the PDF header */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-full w-24 origin-bottom-left -skew-x-12 bg-sultan-orange"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-24 top-0 h-full w-2 origin-bottom-left -skew-x-12 bg-sultan-orange/80"
            />
          </header>
          <main className="flex flex-1 flex-col px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
