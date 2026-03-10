"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrderAction } from "@/lib/actions";
import { appendLocalOrderHistory } from "@/lib/local-order-history";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function DeleteOrderForm({ orderId, customerName }: { orderId: string; customerName: string }) {
  const router = useRouter();
  const { notify } = useFeedback();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" onClick={() => setOpen((current) => !current)} className="rounded-full">
        {open ? "Cancel delete" : "Delete order"}
      </Button>
      {open ? (
        <div className="space-y-3 rounded-[1.5rem] border p-4">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is this order being deleted?"
            className="min-h-[88px] rounded-2xl"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending || reason.trim().length < 3}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteOrderAction({ orderId, reason });
                if (result?.error) {
                  notify({
                    tone: "error",
                    title: "Delete failed",
                    description: result.error
                  });
                  return;
                }

                notify({
                  tone: "success",
                  title: "Order deleted",
                  description: "The order was removed from active screens."
                });
                appendLocalOrderHistory({
                  id: `${orderId}-${Date.now()}`,
                  orderId,
                  customerName,
                  action: "deleted",
                  reason,
                  createdAt: new Date().toISOString()
                });
                setOpen(false);
                setReason("");
                router.refresh();
              })
            }
          >
            {isPending ? "Deleting..." : "Confirm delete"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
