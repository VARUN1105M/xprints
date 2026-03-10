"use client";

import Link from "next/link";
import { User2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { ConnectionStatus } from "@/components/layout/connection-status";
import { LogoutButton } from "@/components/layout/logout-button";
import { SIDEBAR_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          {SIDEBAR_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                aria-label={link.label}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus />
          <Link
            href="/profile"
            title="Profile"
            aria-label="Profile"
            className={cn(
              "inline-flex items-center justify-center rounded-full border p-2.5 transition-colors",
              pathname === "/profile" ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <User2 className="h-4 w-4" />
          </Link>
          <LogoutButton className="rounded-full border px-4 py-2" />
        </div>
      </div>
    </header>
  );
}
