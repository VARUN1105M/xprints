"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPaymentReceivedAction } from "@/lib/actions";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function MarkPaymentForm({ orderId, defaultAmount }: { orderId: string; defaultAmount: number }) {
  const router = useRouter();
  const { notify } = useFeedback();
  const [amount, setAmount] = useState(String(defaultAmount));
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "credit">("cash");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const parsedAmount = Number(amount);
  const isValidAmount = amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount >= 0;
  const needsReason = isValidAmount && Math.abs(parsedAmount - defaultAmount) > 0.009;

  return (
    <div className="min-w-[260px] max-w-[420px] space-y-2">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr),minmax(0,0.9fr),auto]">
        <Input type="number" min={0} value={amount} onChange={(event) => setAmount(event.target.value)} />
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
              const result = await markPaymentReceivedAction({
                orderId,
                amount: parsedAmount,
                paymentMethod,
                reason: needsReason ? reason : undefined
              });
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
              setReason("");
              notify({
                tone: "success",
                title: "Payment received",
                description: `Order ${orderId.slice(0, 8)} is now marked as paid.`
              });
              router.refresh();
            })
          }
          disabled={isPending || !isValidAmount || (needsReason && reason.trim().length < 2)}
        >
          {isPending ? "Saving..." : "Received"}
        </Button>
      </div>
      {needsReason ? (
        <div className="rounded-2xl border border-dashed p-3">
          <p className="text-xs text-muted-foreground">This amount is different from the amount due. Please add a short reason before saving.</p>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Example: discount, advance received, rounded amount"
            className="mt-2 min-h-[76px] rounded-2xl"
          />
        </div>
      ) : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
