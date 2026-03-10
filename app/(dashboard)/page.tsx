import { formatDistanceToNow } from "date-fns";
import { getDashboardMetrics, getInventory, getRecentOrders } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DashboardPage() {
  const [metrics, recentOrders, inventoryState] = await Promise.all([
    getDashboardMetrics(),
    getRecentOrders(),
    getInventory()
  ]);

  const serviceMix = recentOrders.reduce(
    (acc, order) => {
      order.order_items.forEach((item) => {
        if (item.service_category === "printing") {
          acc.printing += (item.pages ?? 0) * (item.copies ?? 0);
        } else {
          acc.other += item.quantity ?? 0;
        }
      });
      return acc;
    },
    { printing: 0, other: 0 }
  );

  const recentPaid = recentOrders.filter((order) => order.payment_status === "paid").length;
  const recentPending = recentOrders.length - recentPaid;
  const departmentPulse = Array.from(
    recentOrders.reduce((map, order) => {
      map.set(order.customers.department, (map.get(order.customers.department) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxDepartmentPulse = Math.max(...departmentPulse.map(([, value]) => value), 1);
  const maxInventory = Math.max(...inventoryState.inventory.map((item) => Number(item.quantity)), 1);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Today's revenue" value={formatCurrency(metrics.todaysRevenue)} hint="Payments captured today" />
        <MetricCard label="Orders today" value={formatNumber(metrics.ordersToday)} hint="Jobs opened today" />
        <MetricCard label="Total copies printed" value={formatNumber(metrics.totalCopiesPrinted)} hint="Printing workload today" />
        <MetricCard label="Pending payments" value={formatNumber(metrics.pendingPayments)} hint="Open receivables" />
        <MetricCard label="Other services count" value={formatNumber(metrics.otherServicesCount)} hint="Binding and report jobs today" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operations overview</CardTitle>
            <CardDescription>What the shop is processing right now, using your most recent live orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Payment clearance</span>
                <span>{recentOrders.length ? `${recentPaid}/${recentOrders.length} cleared` : "No recent orders"}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${recentOrders.length ? (recentPaid / recentOrders.length) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Paid {formatNumber(recentPaid)}</span>
                <span>Pending {formatNumber(recentPending)}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Print volume</p>
                <p className="mt-3 text-3xl font-semibold">{formatNumber(serviceMix.printing)}</p>
                <p className="mt-2 text-sm text-muted-foreground">Printed pages in the recent order stream</p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Other services</p>
                <p className="mt-3 text-3xl font-semibold">{formatNumber(serviceMix.other)}</p>
                <p className="mt-2 text-sm text-muted-foreground">Binding and report quantities in motion</p>
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Live sync</p>
                <Badge variant="success">Auto refresh</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Orders, customers, payments, and inventory changes are reflected automatically after save.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department pulse</CardTitle>
            <CardDescription>Departments creating the most recent workload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentPulse.length ? (
              departmentPulse.map(([department, total]) => (
                <div key={department} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{department}</span>
                    <span>{formatNumber(total)} orders</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${(total / maxDepartmentPulse) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent department activity yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory health</CardTitle>
            <CardDescription>A clearer stock view than a plain low-stock note.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventoryState.inventory.map((item) => {
              const quantity = Number(item.quantity);
              const lowLimit = Number(item.low_stock_limit);
              const isLow = quantity <= lowLimit;
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.item_name}</span>
                    <span>{`${formatNumber(quantity)} ${item.unit}`}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={isLow ? "h-full rounded-full bg-destructive" : "h-full rounded-full bg-foreground"}
                      style={{ width: `${Math.max(8, (quantity / maxInventory) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{isLow ? "Needs restock" : "Healthy"}</span>
                    <span>Threshold {formatNumber(lowLimit)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Live order stream with customer, department, and payment state.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Academic info</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.customers.name}</TableCell>
                    <TableCell>{`${order.customers.department} - ${order.customers.year} - ${order.customers.section}`}</TableCell>
                    <TableCell>{order.order_items.map((item) => item.service_type).join(", ")}</TableCell>
                    <TableCell>
                      <Badge variant={order.payment_status === "paid" ? "success" : "outline"}>{order.payment_status}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(Number(order.total_price))}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
