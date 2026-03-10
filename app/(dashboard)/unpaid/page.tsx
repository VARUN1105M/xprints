import { getUnpaidOrdersWithSearch } from "@/lib/data";
import { getTotalPages } from "@/lib/pagination";
import { formatCurrency } from "@/lib/utils";
import { MarkPaymentForm } from "@/components/orders/mark-payment-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function UnpaidPage({
  searchParams
}: {
  searchParams?: { page?: string; q?: string };
}) {
  const page = Number(searchParams?.page ?? "1");
  const search = searchParams?.q ?? "";
  const { orders, total } = await getUnpaidOrdersWithSearch({ page, search });
  const totalPages = getTotalPages(total, 10);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle>Unpaid jobs</CardTitle>
          <CardDescription>Track pending orders, search quickly, and capture payment as it comes in.</CardDescription>
        </div>
        <form>
          <Input name="q" placeholder="Search customer, service, department, order id" defaultValue={search} />
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
                      <p className="text-xs text-muted-foreground">
                        {order.customers.department} - {order.customers.year} - {order.customers.section}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(Number(order.total_price))}</p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{order.order_items.map((item) => item.service_type).join(", ")}</p>
                  <div className="mt-4">
                    <MarkPaymentForm orderId={order.id} defaultAmount={Number(order.total_price)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Amount due</TableHead>
                    <TableHead>Mark paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.customers.name}</TableCell>
                      <TableCell>
                        {order.customers.department} - {order.customers.year} - {order.customers.section}
                      </TableCell>
                      <TableCell>{order.order_items.map((item) => item.service_type).join(", ")}</TableCell>
                      <TableCell>{formatCurrency(Number(order.total_price))}</TableCell>
                      <TableCell>
                        <MarkPaymentForm orderId={order.id} defaultAmount={Number(order.total_price)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            There are no unpaid jobs right now. New unpaid orders will appear here automatically.
          </div>
        )}
        <Pagination basePath="/unpaid" page={page} totalPages={totalPages} query={{ q: search }} />
      </CardContent>
    </Card>
  );
}
