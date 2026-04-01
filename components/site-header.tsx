"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/rankings", label: "Rankings" },
  { href: "/states", label: "State Explorer" },
  { href: "/methodology", label: "Methodology" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 shadow-[0_12px_32px_rgba(18,45,55,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-[0_10px_24px_rgba(16,91,115,0.22)] ring-4 ring-white/70">
              E
            </div>
            <div>
              <div className="text-lg font-semibold">Ephor</div>
              <div className="text-sm text-muted-foreground">U.S. state performance dashboard</div>
            </div>
          </Link>
          <Badge>Federal sources only</Badge>
        </div>
        <nav className="flex items-center gap-2 rounded-full border border-border/60 bg-white/90 p-1.5 shadow-[0_10px_28px_rgba(18,45,55,0.08)]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                  ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(16,91,115,0.18)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
