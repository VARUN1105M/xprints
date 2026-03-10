"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import type { SearchResult } from "@/lib/types";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setOpen(false);
        return;
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      const data = (await response.json()) as SearchResult[];
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Global search for customers or orders"
        className="pl-9"
      />
      {open && results.length ? (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border bg-card p-2 shadow-soft">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.href}
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              className="block rounded-xl px-3 py-2 hover:bg-muted"
            >
              <p className="text-sm font-medium">{result.title}</p>
              <p className="text-xs text-muted-foreground">{result.subtitle}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
