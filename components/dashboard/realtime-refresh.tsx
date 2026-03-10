"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function RealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("xprints-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
