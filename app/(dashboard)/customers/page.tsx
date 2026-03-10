import { getCustomers } from "@/lib/data";
import { getTotalPages } from "@/lib/pagination";
import { formatCurrency } from "@/lib/utils";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function CustomersPage({
  searchParams
}: {
  searchParams?: { page?: string; q?: string; department?: string; year?: string; customerId?: string };
}) {
  const page = Number(searchParams?.page ?? "1");
  const search = searchParams?.q ?? "";
  const department = searchParams?.department ?? "ALL";
  const year = searchParams?.year ?? "ALL";
  const selectedCustomerId = searchParams?.customerId;
  const { customers, total, history } = await getCustomers({
    page,
    search,
    department,
    year,
    selectedCustomerId
  });
  const totalPages = getTotalPages(total, 10);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Search repeat customers, filter by department, and open job history.</CardDescription>
          </div>
          <CustomerFilters search={search} department={department} year={year} />
        </CardHeader>
        <CardContent className="space-y-6">
          {customers.length ? (
            <>
              <div className="grid gap-4 md:hidden">
                {customers.map((customer) => (
                  <div key={customer.id} className="rounded-2xl border p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.name} />
                      <div className="min-w-0">
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Department:</span> {customer.department}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Year / Section:</span> {customer.year} / {customer.section}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Created:</span> {new Date(customer.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <a className="mt-4 inline-flex text-sm font-medium underline underline-offset-4" href={`/customers?customerId=${customer.id}`}>
                      View history
                    </a>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>History</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={customer.name} />
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">{customer.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.department}</TableCell>
                        <TableCell>{customer.year}</TableCell>
                        <TableCell>{customer.section}</TableCell>
                        <TableCell>{new Date(customer.created_at).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>
                          <a className="text-sm font-medium underline underline-offset-4" href={`/customers?customerId=${customer.id}`}>
                            View history
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              No customers matched this filter yet.
            </div>
          )}
          <Pagination basePath="/customers" page={page} totalPages={totalPages} query={{ q: search, department, year }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job history</CardTitle>
          <CardDescription>
            {selectedCustomerId ? "Latest orders for the selected customer." : "Choose a customer to inspect order history."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length ? (
            history.map((order) => (
              <div key={order.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{order.customers.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customers.department} - {order.customers.year} - {order.customers.section}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("en-IN")}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(Number(order.total_price))}</p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{order.order_items.map((item) => item.service_type).join(", ")}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No customer history loaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
