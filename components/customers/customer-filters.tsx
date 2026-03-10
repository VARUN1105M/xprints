"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DEPARTMENTS, YEARS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function CustomerFilters({
  search,
  department,
  year
}: {
  search: string;
  department: string;
  year: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(search);
  const [selectedDepartment, setSelectedDepartment] = useState(department);
  const [selectedYear, setSelectedYear] = useState(year);

  function applyFilters(next: { query?: string; department?: string; year?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = next.query ?? query;
    const nextDepartment = next.department ?? selectedDepartment;
    const nextYear = next.year ?? selectedYear;

    params.delete("page");

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }

    if (nextDepartment !== "ALL") {
      params.set("department", nextDepartment);
    } else {
      params.delete("department");
    }

    if (nextYear !== "ALL") {
      params.set("year", nextYear);
    } else {
      params.delete("year");
    }

    router.push(`/customers?${params.toString()}`);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1.4fr,auto,0.8fr,0.8fr]">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            applyFilters({});
          }
        }}
        placeholder="Search customer name"
      />
      <Button type="button" variant="outline" onClick={() => applyFilters({})}>
        Search
      </Button>
      <Select
        value={selectedDepartment}
        onChange={(event) => {
          const value = event.target.value;
          setSelectedDepartment(value);
          applyFilters({ department: value });
        }}
      >
        <option value="ALL">All departments</option>
        {DEPARTMENTS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
      <Select
        value={selectedYear}
        onChange={(event) => {
          const value = event.target.value;
          setSelectedYear(value);
          applyFilters({ year: value });
        }}
      >
        <option value="ALL">All years</option>
        {YEARS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
    </div>
  );
}
