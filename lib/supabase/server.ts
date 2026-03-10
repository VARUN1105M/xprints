import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type SupabaseCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: SupabaseCookie[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              (cookieStore as any).set(name, value, options);
            });
          } catch {
            // Server Components can read cookies but may reject writes.
            // Middleware refreshes auth cookies for subsequent requests.
          }
        }
      }
    }
  );
}
