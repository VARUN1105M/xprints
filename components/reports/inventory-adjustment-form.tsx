"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustInventoryAction } from "@/lib/actions";
import { useFeedback } from "@/components/providers/feedback-provider";
import type { InventoryItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function InventoryAdjustmentForm({ inventory }: { inventory: InventoryItem[] }) {
  const router = useRouter();
  const { notify } = useFeedback();
  const [inventoryId, setInventoryId] = useState(inventory[0]?.id ?? "");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          setMessage(null);
          const result = await adjustInventoryAction({ inventoryId, type, quantity, reason });
          if (result?.error) {
            setMessage(result.error);
            notify({
              tone: "error",
              title: "Stock adjustment failed",
              description: result.error
            });
            return;
          }
          setReason("");
          setQuantity(1);
          setMessage("Inventory updated successfully.");
          notify({
            tone: "success",
            title: "Inventory updated",
            description: "The stock movement was saved and the dashboard has refreshed."
          });
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label>Inventory item</Label>
        <Select value={inventoryId} onChange={(event) => setInventoryId(event.target.value)}>
          {inventory.map((item) => (
            <option key={item.id} value={item.id}>
              {item.item_name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onChange={(event) => setType(event.target.value as "IN" | "OUT")}>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Reason</Label>
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Received new stock, manual correction, damaged material..." required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save adjustment"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
