"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearCurrentDataAction } from "@/lib/actions";
import { clearLocalOrderHistory } from "@/lib/local-order-history";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ClearCurrentDataForm() {
  const router = useRouter();
  const { notify } = useFeedback();
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();
  const isConfirmed = confirmation.trim() === "CLEAR";

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-destructive/30 bg-destructive/5 p-5">
      <div className="space-y-2">
        <p className="font-medium">Remove current website data</p>
        <p className="text-sm text-muted-foreground">
          This clears customers, orders, payments, saved activity, and inventory transactions. Admin access and pricing stay available.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder='Type "CLEAR" to confirm'
          className="rounded-2xl bg-background"
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isPending || !isConfirmed}
          onClick={() =>
            startTransition(async () => {
              const result = await clearCurrentDataAction({ confirmation });

              if (result?.error) {
                notify({
                  tone: "error",
                  title: "Data reset failed",
                  description: result.error
                });
                return;
              }

              clearLocalOrderHistory();
              setConfirmation("");
              notify({
                tone: "success",
                title: "Current data removed",
                description: result?.summary ?? "The website data was cleared."
              });
              router.refresh();
            })
          }
        >
          {isPending ? "Clearing..." : "Clear current data"}
        </Button>
      </div>
    </div>
  );
}
