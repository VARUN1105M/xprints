import { formatDistanceToNow } from "date-fns";
import { getProfileData } from "@/lib/data";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportDataButton } from "@/components/profile/export-data-button";
import { ClearCurrentDataForm } from "@/components/profile/clear-current-data-form";
import { OrderActivityHistory } from "@/components/profile/order-activity-history";

export default async function ProfilePage() {
  const profile = await getProfileData();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-[1.75rem] border bg-muted/40 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar name={profile.user.email} />
                <div>
                  <h1 className="text-2xl font-semibold">Profile</h1>
                  <p className="text-sm text-muted-foreground">{profile.user.email}</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Last sign in{" "}
              {profile.user.lastSignInAt
                ? formatDistanceToNow(new Date(profile.user.lastSignInAt), { addSuffix: true })
                : "not available"}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Customers</p>
              <p className="mt-3 text-3xl font-semibold">{profile.stats.totalCustomers}</p>
            </div>
            <div className="rounded-[1.75rem] border p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Orders</p>
              <p className="mt-3 text-3xl font-semibold">{profile.stats.totalOrders}</p>
            </div>
            <div className="rounded-[1.75rem] border p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Unpaid jobs</p>
              <p className="mt-3 text-3xl font-semibold">{profile.stats.unpaidOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Data export</CardTitle>
            <CardDescription>Download customers, orders, and payment records in one Excel workbook.</CardDescription>
          </div>
          <ExportDataButton customers={profile.customers} orders={profile.orders} />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Customers sheet</p>
            <p className="mt-2">Name, department, year, section, and created date.</p>
          </div>
          <div className="rounded-[1.5rem] border p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Orders sheet</p>
            <p className="mt-2">Customer details, services, totals, payment state, and timestamps.</p>
          </div>
          <div className="rounded-[1.5rem] border p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Payments sheet</p>
            <p className="mt-2">Amounts, methods, statuses, and payment dates.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Clear the current operational data from the website without removing admin access.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClearCurrentDataForm />
        </CardContent>
      </Card>

      <OrderActivityHistory serverHistory={profile.history} />
    </div>
  );
}
