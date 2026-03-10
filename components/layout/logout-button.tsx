"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Submit />
    </form>
  );
}
