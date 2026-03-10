import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Parameters<typeof response.cookies.set>[0]) {
          (request.cookies as any).set(name, value, options);
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          (response.cookies as any).set(name, value, options);
        },
        remove(name: string, options: Parameters<typeof response.cookies.set>[0]) {
          (request.cookies as any).set(name, "", options);
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          (response.cookies as any).set(name, "", options);
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isAdmin = !!user?.email && adminEmails.includes(user.email.toLowerCase());

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && !isAdmin) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "Access restricted to admin emails.");
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
