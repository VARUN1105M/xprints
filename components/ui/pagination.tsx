import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  basePath,
  page,
  totalPages,
  query
}: {
  basePath: string;
  page: number;
  totalPages: number;
  query?: Record<string, string | number | undefined>;
}) {
  const makeHref = (target: number) => {
    const params = new URLSearchParams();
    Object.entries({ ...query, page: String(target) }).forEach(([key, value]) => {
      if (value && value !== "ALL") {
        params.set(key, String(value));
      }
    });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={makeHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-50")}
        >
          Previous
        </Link>
        <Link
          href={makeHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), page >= totalPages && "pointer-events-none opacity-50")}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
