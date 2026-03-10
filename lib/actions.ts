"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SERVICE_CATEGORY_MAP } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateTotalFromRate, suggestPrice } from "@/lib/pricing";
import { createOrderSchema, inventoryAdjustmentSchema, paymentUpdateSchema } from "@/lib/validation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(email)) {
    redirect("/login?error=Only%20configured%20admin%20emails%20can%20sign%20in.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createOrderAction(payload: {
  customerName: string;
  department: string;
  year: string;
  section: string;
  paymentStatus: "paid" | "pending";
  amountPaid: number;
  items: Array<{
    serviceType: string;
    unitPrice: number;
    pages: number;
    copies: number;
    isDoubleSided: boolean;
    quantity: number;
    price: number;
  }>;
}) {
  const validated = createOrderSchema.parse({
    ...payload,
    amountPaid: Number(payload.amountPaid),
    items: payload.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      pages: Number(item.pages),
      copies: Number(item.copies),
      isDoubleSided: Boolean(item.isDoubleSided),
      quantity: Number(item.quantity),
      price:
        Number(item.price) ||
        calculateTotalFromRate(
          item.serviceType as never,
          Number(item.unitPrice) || suggestPrice(item.serviceType as never, 1, 1),
          Number(item.copies),
          Number(item.quantity),
          Number(item.pages),
          Boolean(item.isDoubleSided)
        )
    }))
  });

  const supabase = await createSupabaseServerClient();
  const normalizedName = validated.customerName.trim();

  const { data: existingCustomerData } = await supabase
    .from("customers")
    .select("id")
    .ilike("name", normalizedName)
    .eq("department", validated.department)
    .eq("year", validated.year)
    .eq("section", validated.section)
    .maybeSingle();

  const existingCustomer = existingCustomerData as { id: string } | null;
  let customerId = existingCustomer?.id;

  if (!customerId) {
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: normalizedName,
        department: validated.department,
        year: validated.year,
        section: validated.section
      })
      .select("id")
      .single();

    const customer = customerData as { id: string } | null;
    if (customerError || !customer) {
      return { error: customerError?.message ?? "Unable to create customer." };
    }

    customerId = customer.id;
  }

  const totalPrice = validated.items.reduce((sum, item) => sum + Number(item.price), 0);

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      total_price: totalPrice,
      payment_status: validated.paymentStatus
    })
      .select("id")
      .single();

  const order = orderData as { id: string } | null;
  if (orderError || !order) {
    return { error: orderError?.message ?? "Unable to create order." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    validated.items.map((item) => ({
      order_id: order.id,
      service_type: item.serviceType,
      service_category: SERVICE_CATEGORY_MAP[item.serviceType],
      unit_price: item.unitPrice,
      pages: SERVICE_CATEGORY_MAP[item.serviceType] === "printing" ? item.pages : null,
      copies: SERVICE_CATEGORY_MAP[item.serviceType] === "printing" ? item.copies : null,
      is_double_sided: SERVICE_CATEGORY_MAP[item.serviceType] === "printing" ? item.isDoubleSided : null,
      quantity: SERVICE_CATEGORY_MAP[item.serviceType] === "other" ? item.quantity : null,
      price: item.price
    }))
  );

  if (itemsError) {
    return { error: itemsError.message };
  }

  const paymentAmount = validated.paymentStatus === "paid" ? totalPrice : validated.amountPaid;
  const derivedPaymentMethod =
    validated.paymentStatus === "pending" && paymentAmount === 0 ? "credit" : "cash";
  if (paymentAmount > 0 || validated.paymentStatus === "pending") {
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      amount: paymentAmount,
      payment_method: derivedPaymentMethod,
      payment_status: validated.paymentStatus,
      payment_date: new Date().toISOString()
    });

    if (paymentError) {
      return { error: paymentError.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/orders/new");
  revalidatePath("/customers");
  revalidatePath("/inventory");
  revalidatePath("/reports");
  revalidatePath("/unpaid");

  return { success: true, orderId: order.id };
}

export async function markPaymentReceivedAction(payload: {
  orderId: string;
  amount: number;
  paymentMethod: "cash" | "upi" | "card" | "credit";
}) {
  const validated = paymentUpdateSchema.parse({
    ...payload,
    amount: Number(payload.amount)
  });
  const supabase = await createSupabaseServerClient();

  const { error: orderError } = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", validated.orderId);

  if (orderError) {
    return { error: orderError.message };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: validated.orderId,
    amount: validated.amount,
    payment_method: validated.paymentMethod,
    payment_status: "paid",
    payment_date: new Date().toISOString()
  });

  if (paymentError) {
    return { error: paymentError.message };
  }

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/reports");
  revalidatePath("/unpaid");

  return { success: true };
}

export async function adjustInventoryAction(payload: {
  inventoryId: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string;
}) {
  const validated = inventoryAdjustmentSchema.parse({
    ...payload,
    quantity: Number(payload.quantity)
  });

  const supabase = await createSupabaseServerClient();
  const { data: currentItemData, error: currentError } = await supabase
    .from("inventory")
    .select("*")
    .eq("id", validated.inventoryId)
    .single();

  const currentItem = currentItemData as { quantity: number } | null;
  if (currentError || !currentItem) {
    return { error: currentError?.message ?? "Inventory item not found." };
  }

  const updatedQuantity =
    validated.type === "IN"
      ? Number(currentItem.quantity) + validated.quantity
      : Number(currentItem.quantity) - validated.quantity;

  const { error: inventoryError } = await supabase
    .from("inventory")
    .update({ quantity: updatedQuantity })
    .eq("id", validated.inventoryId);

  if (inventoryError) {
    return { error: inventoryError.message };
  }

  const { error: transactionError } = await supabase.from("transactions").insert({
    inventory_id: validated.inventoryId,
    type: validated.type,
    quantity: validated.quantity,
    reason: validated.reason
  });

  if (transactionError) {
    return { error: transactionError.message };
  }

  revalidatePath("/inventory");
  revalidatePath("/");

  return { success: true };
}
