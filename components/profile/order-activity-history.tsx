"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LOCAL_ORDER_HISTORY_EVENT,
  readLocalOrderHistory,
  type LocalOrderHistoryEntry
} from "@/lib/local-order-history";
import type { OrderHistory } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UnifiedHistory = {
  id: string;
  orderId: string;
  customerName: string;
  action: "edited" | "deleted";
  reason: string;
  createdAt: string;
};

export function OrderActivityHistory({
  serverHistory
}: {
  serverHistory: OrderHistory[];
}) {
  const [localHistory, setLocalHistory] = useState<LocalOrderHistoryEntry[]>([]);

  useEffect(() => {
    const syncLocalHistory = () => {
      setLocalHistory(readLocalOrderHistory());
    };

    syncLocalHistory();
    window.addEventListener("storage", syncLocalHistory);
    window.addEventListener(LOCAL_ORDER_HISTORY_EVENT, syncLocalHistory);

    return () => {
      window.removeEventListener("storage", syncLocalHistory);
      window.removeEventListener(LOCAL_ORDER_HISTORY_EVENT, syncLocalHistory);
    };
  }, []);

  const entries = useMemo(() => {
    const fromServer: UnifiedHistory[] = serverHistory
      .filter((entry): entry is OrderHistory & { action: "edited" | "deleted" } => entry.action === "edited" || entry.action === "deleted")
      .map((entry) => {
        const snapshot = entry.snapshot as { customers?: { name?: string } } | null;
        return {
          id: entry.id,
          orderId: entry.order_id,
          customerName: snapshot?.customers?.name ?? "Order",
          action: entry.action,
          reason: entry.reason ?? "",
          createdAt: entry.created_at
        };
      });

    const merged = [...localHistory, ...fromServer];
    const seen = new Set<string>();

    return merged
      .filter((entry) => {
        const key = `${entry.action}-${entry.orderId}-${entry.reason}-${entry.createdAt}`;
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [localHistory, serverHistory]);

  const edited = entries.filter((entry) => entry.action === "edited");
  const deleted = entries.filter((entry) => entry.action === "deleted");

  function renderList(items: UnifiedHistory[], emptyText: string) {
    if (!items.length) {
      return <p className="text-sm text-muted-foreground">{emptyText}</p>;
    }

    return (
      <div className="space-y-3">
        {items.map((entry) => (
          <div key={`${entry.id}-${entry.createdAt}`} className="rounded-2xl border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{entry.customerName}</p>
              <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Order ID: {entry.orderId.slice(0, 8).toUpperCase()}</p>
            <p className="mt-2 text-sm text-muted-foreground">{entry.reason}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Edited history</CardTitle>
          <CardDescription>Orders changed with a saved reason.</CardDescription>
        </CardHeader>
        <CardContent>{renderList(edited, "No edited order history yet.")}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Deleted history</CardTitle>
          <CardDescription>Orders removed from active screens.</CardDescription>
        </CardHeader>
        <CardContent>{renderList(deleted, "No deleted order history yet.")}</CardContent>
      </Card>
    </div>
  );
}
