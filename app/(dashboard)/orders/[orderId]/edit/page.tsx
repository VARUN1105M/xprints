import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForEdit } from "@/lib/data";
import { NewOrderForm } from "@/components/orders/new-order-form";

export default async function EditOrderPage({
  params
}: {
  params: { orderId: string };
}) {
  const { order, history } = await getOrderForEdit(params.orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/orders" className="inline-flex text-sm font-medium text-muted-foreground underline underline-offset-4">
        Back to orders
      </Link>
      <NewOrderForm
        mode="edit"
        history={history}
        initialOrder={{
          orderId: order.id,
          customerName: order.customers.name,
          department: order.customers.department,
          year: order.customers.year,
          section: order.customers.section,
          paymentStatus: order.payment_status,
          items: order.order_items.map((item) => ({
            serviceType: item.service_type,
            unitPrice: Number(item.unit_price ?? 0),
            pages: Number(item.pages ?? 1),
            copies: Number(item.copies ?? 1),
            isDoubleSided: Boolean(item.is_double_sided),
            quantity: Number(item.quantity ?? 1),
            price: Number(item.price)
          }))
        }}
      />
    </div>
  );
}
