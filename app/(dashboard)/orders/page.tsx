import Link from "next/link";
import { getOrders } from "@/lib/data";
import { getTotalPages } from "@/lib/pagination";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { DeleteOrderForm } from "@/components/orders/delete-order-form";

export default async function OrdersPage({
  searchParams
}: {
  searchParams?: { page?: string; q?: string; status?: string };
}) {
  const page = Number(searchParams?.page ?? "1");
  const search = searchParams?.q ?? "";
  const status = searchParams?.status ?? "ALL";
  const { orders, total } = await getOrders({ page, search, paymentStatus: status });
  const totalPages = getTotalPages(total, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Detailed order view with payment state, service breakdown, edit controls, and delete reasons.</CardDescription>
          </div>
          <form className="grid gap-3 sm:grid-cols-[1.4fr,0.8fr]">
            <Input name="q" placeholder="Search order id, customer, service, department" defaultValue={search} />
            <select name="status" defaultValue={status} className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm">
              <option value="ALL">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </form>
        </CardHeader>
        <CardContent className="space-y-6">
          {orders.length ? (
            orders.map((order) => (
              <div key={order.id} className="rounded-[1.75rem] border p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">{order.customers.name}</p>
                      <Badge variant={order.payment_status === "paid" ? "success" : "outline"}>{order.payment_status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customers.department} - {order.customers.year} - {order.customers.section}
                    </p>
                    <p className="text-xs text-muted-foreground">Order ID: {order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-semibold">{formatCurrency(Number(order.total_price))}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,0.9fr]">
                  <div className="rounded-[1.5rem] border bg-muted/20 p-4">
                    <p className="font-medium">Service details</p>
                    <div className="mt-3 space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-background px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{item.service_type}</p>
                            <p className="font-semibold">{formatCurrency(Number(item.price))}</p>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.service_category === "printing"
                              ? `${item.pages} pages x ${item.copies} copies - ${item.is_double_sided ? "double side" : "single side"}`
                              : `${item.quantity} item${Number(item.quantity) > 1 ? "s" : ""}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border bg-muted/20 p-4">
                      <p className="font-medium">Order timeline</p>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <p>Created: {new Date(order.created_at).toLocaleString("en-IN")}</p>
                        <p>Updated: {order.updated_at ? new Date(order.updated_at).toLocaleString("en-IN") : "Not updated yet"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/orders/${order.id}/edit`} className="inline-flex rounded-full border px-4 py-2 text-sm font-medium">
                        Edit order
                      </Link>
                    </div>
                    <DeleteOrderForm orderId={order.id} customerName={order.customers.name} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              No orders matched this filter.
            </div>
          )}
          <Pagination basePath="/orders" page={page} totalPages={totalPages} query={{ q: search, status }} />
        </CardContent>
      </Card>
    </div>
  );
}
