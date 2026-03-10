import { redirect } from "next/navigation";
import { loginAction } from "@/lib/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/orders/new");
  }

  return (
    <main className="surface-grid flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md border-foreground/10 bg-background/95 backdrop-blur">
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">XPrints</p>
          <CardTitle className="text-3xl">Admin access</CardTitle>
          <CardDescription>Sign in with the configured Supabase admin account to manage shop operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@college.edu" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            {searchParams?.error ? <p className="text-sm text-destructive">{searchParams.error}</p> : null}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
