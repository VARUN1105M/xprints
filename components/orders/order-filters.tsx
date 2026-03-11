"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function OrderFilters({
  search,
  status
}: {
  search: string;
  status: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(search);
  const [selectedStatus, setSelectedStatus] = useState(status);

  function applyFilters(next?: { query?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = next?.query ?? query;
    const nextStatus = next?.status ?? selectedStatus;

    params.delete("page");

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextStatus !== "ALL") {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    const queryString = params.toString();
    router.push(queryString ? `/orders?${queryString}` : "/orders");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1.4fr,auto,0.8fr]">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            applyFilters();
          }
        }}
        placeholder="Search order id, customer, service, department"
      />
      <Button type="button" variant="outline" onClick={() => applyFilters()}>
        Search
      </Button>
      <Select
        value={selectedStatus}
        onChange={(event) => {
          const value = event.target.value;
          setSelectedStatus(value);
          applyFilters({ status: value });
        }}
      >
        <option value="ALL">All statuses</option>
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
      </Select>
    </div>
  );
}
