import { getOrders } from "@/lib/data";
import { getTotalPages } from "@/lib/pagination";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
            <CardDescription>Paginated view of all jobs with payment status and service breakdown.</CardDescription>
          </div>
          <form className="grid gap-3 sm:grid-cols-[1.4fr,0.8fr]">
            <Input name="q" placeholder="Search order id, customer, department" defaultValue={search} />
            <select
              name="status"
              defaultValue={status}
              className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </form>
        </CardHeader>
        <CardContent className="space-y-6">
          {orders.length ? (
            <>
              <div className="grid gap-4 md:hidden">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{order.customers.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.customers.department} - {order.customers.year} - {order.customers.section}
                        </p>
                      </div>
                      <Badge variant={order.payment_status === "paid" ? "success" : "outline"}>{order.payment_status}</Badge>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Order:</span>{" "}
                        <span className="font-mono text-xs uppercase">{order.id.slice(0, 8)}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Services:</span> {order.order_items.map((item) => item.service_type).join(", ")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Total:</span> {formatCurrency(Number(order.total_price))}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Created:</span> {new Date(order.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs uppercase">{order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <p className="font-medium">{order.customers.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customers.department} - {order.customers.year} - {order.customers.section}
                          </p>
                        </TableCell>
                        <TableCell>{order.order_items.map((item) => item.service_type).join(", ")}</TableCell>
                        <TableCell>{formatCurrency(Number(order.total_price))}</TableCell>
                        <TableCell>
                          <Badge variant={order.payment_status === "paid" ? "success" : "outline"}>{order.payment_status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              No orders matched this filter. Try clearing the search or create a new order.
            </div>
          )}
          <Pagination basePath="/orders" page={page} totalPages={totalPages} query={{ q: search, status }} />
        </CardContent>
      </Card>
    </div>
  );
}
