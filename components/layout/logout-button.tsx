"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Submit({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" disabled={pending} className={cn(className)}>
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <Submit className={className} />
    </form>
  );
}
