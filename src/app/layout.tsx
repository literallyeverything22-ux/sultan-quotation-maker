import type { Metadata, Viewport } from "next";
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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-sultan-white text-sultan-ink antialiased">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-sultan-white">
          <header className="relative flex h-14 items-center justify-between overflow-hidden bg-sultan-black px-4 border-b-4 border-sultan-orange">
            <span className="z-10 text-lg font-bold italic tracking-wide text-sultan-white">
              QUOTATION MAKER
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
