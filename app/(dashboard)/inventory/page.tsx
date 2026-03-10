import { getInventory } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { InventoryAdjustmentForm } from "@/components/reports/inventory-adjustment-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function InventoryPage() {
  const { inventory, transactions } = await getInventory();

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <Card>
        <CardHeader>
          <CardTitle>Inventory tracking</CardTitle>
          <CardDescription>Paper bundles, ink cartridges, and binding materials with low-stock thresholds.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:hidden">
            {inventory.map((item) => {
              const lowStock = Number(item.quantity) <= Number(item.low_stock_limit);
              return (
                <div key={item.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.item_name}</p>
                    <Badge variant={lowStock ? "outline" : "secondary"}>{item.category}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Stock:</span> {formatNumber(Number(item.quantity))} {item.unit}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Low stock line:</span> {formatNumber(Number(item.low_stock_limit))} {item.unit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Low stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const lowStock = Number(item.quantity) <= Number(item.low_stock_limit);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        {formatNumber(Number(item.quantity))} {item.unit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={lowStock ? "outline" : "secondary"}>
                          {formatNumber(Number(item.low_stock_limit))} {item.unit}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual stock adjustment</CardTitle>
            <CardDescription>Add stock receipts or log manual deductions.</CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryAdjustmentForm inventory={inventory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent inventory transactions</CardTitle>
            <CardDescription>Latest automated and manual stock movements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(transactions as Array<Record<string, unknown>>).map((transaction) => (
              <div key={String(transaction.id)} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {String((transaction.inventory as { item_name?: string } | undefined)?.item_name ?? "Inventory item")}
                  </p>
                  <Badge variant={transaction.type === "IN" ? "secondary" : "outline"}>{String(transaction.type)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatNumber(Number(transaction.quantity))} units - {String(transaction.reason)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
