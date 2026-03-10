import { NewOrderForm } from "@/components/orders/new-order-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewOrderPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-6">
          <CardTitle>Create new order</CardTitle>
          <CardDescription>Capture customer details, add services, set manual rates, and save directly into the live database.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <NewOrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
