"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[260px] shrink-0 rounded-[2rem] border bg-card/80 p-4 backdrop-blur lg:flex lg:flex-col">
      <div className="mb-8 px-3 pt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">XPrints</p>
        <h1 className="mt-3 text-2xl font-semibold">Shop console</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {SIDEBAR_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
