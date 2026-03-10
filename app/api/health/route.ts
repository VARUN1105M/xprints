import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ status: "auth_required", message: authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ status: "auth_required", message: "No active admin session." }, { status: 401 });
    }

    const { error } = await supabase.from("inventory").select("id").limit(1);

    if (error) {
      return NextResponse.json({ status: "db_issue", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "connected", message: "Supabase connection healthy." });
  } catch (error) {
    return NextResponse.json(
      { status: "db_issue", message: error instanceof Error ? error.message : "Health check failed" },
      { status: 500 }
    );
  }
}
