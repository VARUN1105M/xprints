import { NextResponse } from "next/server";
import { getCustomerSuggestions, globalSearch } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const scope = searchParams.get("scope") ?? "global";

  try {
    const data = scope === "customers" ? await getCustomerSuggestions(query) : await globalSearch(query);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 401 });
  }
}
