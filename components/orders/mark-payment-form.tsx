"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPaymentReceivedAction } from "@/lib/actions";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function MarkPaymentForm({ orderId, defaultAmount }: { orderId: string; defaultAmount: number }) {
  const router = useRouter();
  const { notify } = useFeedback();
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "credit">("cash");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="min-w-[260px] space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="number" min={0} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
        <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="credit">Credit</option>
        </Select>
        <Button
          size="sm"
          type="button"
          onClick={() =>
            startTransition(async () => {
              setMessage(null);
              const result = await markPaymentReceivedAction({ orderId, amount, paymentMethod });
              if (result?.error) {
                setMessage(result.error);
                notify({
                  tone: "error",
                  title: "Payment update failed",
                  description: result.error
                });
                return;
              }
              setMessage("Payment marked as received.");
              notify({
                tone: "success",
                title: "Payment received",
                description: `Order ${orderId.slice(0, 8)} is now marked as paid.`
              });
              router.refresh();
            })
          }
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Received"}
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
