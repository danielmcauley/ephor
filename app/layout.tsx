import type { Metadata } from "next";

import "@/app/globals.css";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Ephor | State Performance Dashboard",
  description: "Track state performance metrics from official federal data sources."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="mx-auto min-h-[calc(100vh-80px)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
