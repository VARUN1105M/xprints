"use client";

import type { Customer, OrderWithRelations } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function ExportDataButton({
  customers,
  orders
}: {
  customers: Customer[];
  orders: OrderWithRelations[];
}) {
  return (
    <Button
      variant="outline"
      onClick={async () => {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new();

        const customerRows = customers.map((customer) => ({
          Name: customer.name,
          Department: customer.department,
          Year: customer.year,
          Section: customer.section,
          Created: customer.created_at
        }));

        const orderRows = orders.map((order) => ({
          OrderId: order.id,
          Customer: order.customers.name,
          Department: order.customers.department,
          Year: order.customers.year,
          Section: order.customers.section,
          Services: order.order_items.map((item) => item.service_type).join(", "),
          Total: Number(order.total_price),
          PaymentStatus: order.payment_status,
          Created: order.created_at
        }));

        const paymentRows = orders.flatMap((order) =>
          order.payments.map((payment) => ({
            OrderId: order.id,
            Customer: order.customers.name,
            Amount: Number(payment.amount),
            Method: payment.payment_method,
            Status: payment.payment_status,
            Date: payment.payment_date
          }))
        );

        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(customerRows), "Customers");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(orderRows), "Orders");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(paymentRows), "Payments");
        XLSX.writeFile(workbook, `xprints-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
      }}
    >
      Export as Excel
    </Button>
  );
}
