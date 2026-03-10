import { ConnectionStatus } from "@/components/layout/connection-status";
import { GlobalSearch } from "@/components/layout/global-search";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/components/layout/logout-button";

export function Topbar() {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border bg-card/80 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">Operations</p>
          <h2 className="text-2xl font-semibold">Xerox shop management</h2>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <ConnectionStatus />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-3 sm:hidden">
          <ConnectionStatus />
          <ThemeToggle />
          <LogoutButton />
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
