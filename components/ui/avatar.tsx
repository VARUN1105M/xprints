import { getInitials } from "@/lib/utils";

export function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-muted text-sm font-semibold">
      {getInitials(name)}
    </div>
  );
}
