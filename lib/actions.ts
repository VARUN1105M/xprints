"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SERVICE_CATEGORY_MAP } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPricingDetails } from "@/lib/pricing";
import {
  createOrderSchema,
  deleteOrderSchema,
  inventoryAdjustmentSchema,
  paymentUpdateSchema,
  updateOrderSchema
} from "@/lib/validation";

const DEFAULT_INVENTORY_RESET = [
  {
    item_name: "A4 Paper Bundle",
    category: "Paper",
    quantity: 3000,
    unit: "sheets",
    low_stock_limit: 600
  },
  {
    item_name: "Black Ink Cartridge",
    category: "Ink",
    quantity: 40,
    unit: "cartridges",
    low_stock_limit: 8
  },
  {
    item_name: "Color Ink Cartridge",
    category: "Ink",
    quantity: 24,
    unit: "cartridges",
    low_stock_limit: 4
  },
  {
    item_name: "Binding Material",
    category: "Binding",
    quantity: 180,
    unit: "sets",
    low_stock_limit: 24
  }
] as const;

type OrderPayload = {
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
};

function normalizeOrderPayload(payload: OrderPayload) {
  return {
    ...payload,
    amountPaid: Number(payload.amountPaid),
    items: payload.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      pages: Number(item.pages),
      copies: Number(item.copies),
      isDoubleSided: Boolean(item.isDoubleSided),
      quantity: Number(item.quantity),
      price: Number(item.price)
    }))
  };
}

function derivePricedItems(items: OrderPayload["items"]) {
  return items.map((item) => {
    const pricing = getPricingDetails(item.serviceType as never, Number(item.copies), Number(item.quantity), Number(item.pages), Boolean(item.isDoubleSided));
    return {
      ...item,
      unitPrice: pricing.unitRate,
      price: pricing.total
    };
  });
}

async function resolveCustomerId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, payload: {
  customerName: string;
  department: string;
  year: string;
  section: string;
}) {
  const normalizedName = payload.customerName.trim();

  const { data: existingCustomerData } = await supabase
    .from("customers")
    .select("id")
    .ilike("name", normalizedName)
    .eq("department", payload.department)
    .eq("year", payload.year)
    .eq("section", payload.section)
    .maybeSingle();

  const existingCustomer = existingCustomerData as { id: string } | null;
  if (existingCustomer?.id) {
    return { customerId: existingCustomer.id };
  }

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: normalizedName,
      department: payload.department,
      year: payload.year,
      section: payload.section
    })
    .select("id")
    .single();

  const customer = customerData as { id: string } | null;
  if (customerError || !customer) {
    return { error: customerError?.message ?? "Unable to create customer." };
  }

  return { customerId: customer.id };
}

async function syncPaymentsForOrder(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  orderId: string,
  paymentStatus: "paid" | "pending",
  totalPrice: number
) {
  const { error: deletePaymentsError } = await supabase.from("payments").delete().eq("order_id", orderId);

  if (deletePaymentsError) {
    return { error: deletePaymentsError.message };
  }

  const paymentAmount = paymentStatus === "paid" ? totalPrice : 0;
  const paymentMethod = paymentStatus === "paid" ? "cash" : "credit";

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: orderId,
    amount: paymentAmount,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    payment_date: new Date().toISOString()
  });

  if (paymentError) {
    return { error: paymentError.message };
  }

  return { success: true };
}

async function getOrderSnapshot(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, orderId: string) {
  const { data } = await supabase.from("orders").select("*, customers(*), order_items(*), payments(*)").eq("id", orderId).single();
  return data ?? {};
}

async function insertOrderHistory(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: {
    orderId: string;
    action: "created" | "edited" | "deleted" | "payment_updated";
    reason?: string | null;
    snapshot: unknown;
  }
) {
  const { error } = await supabase.from("order_history").insert({
    order_id: payload.orderId,
    action: payload.action,
    reason: payload.reason ?? null,
    snapshot: payload.snapshot as never
  });

  if (error) {
    if (error.message.toLowerCase().includes("order_history") || error.message.toLowerCase().includes("schema cache")) {
      return { success: true };
    }

    return { error: error.message };
  }

  return { success: true };
}

function refreshOrderViews(orderId?: string) {
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/orders/new");
  revalidatePath("/customers");
  revalidatePath("/profile");
  revalidatePath("/unpaid");
  if (orderId) {
    revalidatePath(`/orders/${orderId}/edit`);
  }
}

function hasSchemaCacheColumnError(message?: string) {
  return (message ?? "").toLowerCase().includes("schema cache");
}

function refreshAllViews() {
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/orders/new");
  revalidatePath("/customers");
  revalidatePath("/profile");
  revalidatePath("/unpaid");
  revalidatePath("/inventory");
  revalidatePath("/reports");
}

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

  redirect("/orders/new");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function clearCurrentDataAction(payload: { confirmation: string }) {
  if (payload.confirmation.trim() !== "CLEAR") {
    return { error: 'Type "CLEAR" to confirm the reset.' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthenticated" };
  }

  const [
    { count: customerCount, error: customerCountError },
    { count: orderCount, error: orderCountError },
    { count: transactionCount, error: transactionCountError }
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("transactions").select("id", { count: "exact", head: true })
  ]);

  const countError = customerCountError ?? orderCountError ?? transactionCountError;
  if (countError) {
    return { error: countError.message };
  }

  const { error: customerDeleteError } = await supabase.from("customers").delete().gte("created_at", "1900-01-01T00:00:00.000Z");
  if (customerDeleteError) {
    return { error: customerDeleteError.message };
  }

  const { error: transactionDeleteError } = await supabase.from("transactions").delete().gte("created_at", "1900-01-01T00:00:00.000Z");
  if (transactionDeleteError) {
    return { error: transactionDeleteError.message };
  }

  const { error: inventoryResetError } = await supabase.from("inventory").upsert(DEFAULT_INVENTORY_RESET, {
    onConflict: "item_name"
  });
  if (inventoryResetError) {
    return { error: inventoryResetError.message };
  }

  refreshAllViews();

  return {
    success: true,
    summary: `Cleared ${orderCount ?? 0} orders, ${customerCount ?? 0} customers, and ${transactionCount ?? 0} inventory transactions.`
  };
}

export async function createOrderAction(payload: OrderPayload) {
  const validated = createOrderSchema.parse(normalizeOrderPayload(payload));
  const pricedItems = derivePricedItems(validated.items);
  const totalPrice = pricedItems.reduce((sum, item) => sum + Number(item.price), 0);
  const supabase = await createSupabaseServerClient();

  const customerResult = await resolveCustomerId(supabase, validated);
  if ("error" in customerResult) {
    return { error: customerResult.error };
  }

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerResult.customerId,
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
    pricedItems.map((item) => {
      const serviceType = item.serviceType as keyof typeof SERVICE_CATEGORY_MAP;
      const serviceCategory = SERVICE_CATEGORY_MAP[serviceType];

      return {
        order_id: order.id,
        service_type: serviceType,
        service_category: serviceCategory,
        unit_price: item.unitPrice,
        pages: serviceCategory === "printing" ? item.pages : null,
        copies: serviceCategory === "printing" ? item.copies : null,
        is_double_sided: serviceCategory === "printing" ? item.isDoubleSided : null,
        quantity: serviceCategory === "other" ? item.quantity : null,
        price: item.price
      };
    })
  );

  if (itemsError) {
    return { error: itemsError.message };
  }

  const paymentResult = await syncPaymentsForOrder(supabase, order.id, validated.paymentStatus, totalPrice);
  if ("error" in paymentResult) {
    return { error: paymentResult.error };
  }

  const snapshot = await getOrderSnapshot(supabase, order.id);
  const historyResult = await insertOrderHistory(supabase, {
    orderId: order.id,
    action: "created",
    reason: "Order created",
    snapshot
  });

  if ("error" in historyResult) {
    return { error: historyResult.error };
  }

  refreshOrderViews(order.id);

  return { success: true, orderId: order.id };
}

export async function updateOrderAction(
  payload: OrderPayload & {
    orderId: string;
    reason: string;
  }
) {
  const validated = updateOrderSchema.parse({
    ...normalizeOrderPayload(payload),
    orderId: payload.orderId,
    reason: payload.reason
  });
  const pricedItems = derivePricedItems(validated.items);
  const totalPrice = pricedItems.reduce((sum, item) => sum + Number(item.price), 0);
  const supabase = await createSupabaseServerClient();
  const previousSnapshot = await getOrderSnapshot(supabase, validated.orderId);

  const customerResult = await resolveCustomerId(supabase, validated);
  if ("error" in customerResult) {
    return { error: customerResult.error };
  }

  let { error: orderError } = await supabase
    .from("orders")
    .update({
      customer_id: customerResult.customerId,
      total_price: totalPrice,
      payment_status: validated.paymentStatus,
      updated_at: new Date().toISOString(),
      deleted_at: null,
      deleted_reason: null
    })
    .eq("id", validated.orderId);

  if (orderError && hasSchemaCacheColumnError(orderError.message)) {
    const retry = await supabase
      .from("orders")
      .update({
        customer_id: customerResult.customerId,
        total_price: totalPrice,
        payment_status: validated.paymentStatus
      })
      .eq("id", validated.orderId);
    orderError = retry.error;
  }

  if (orderError) {
    return { error: orderError.message };
  }

  const { error: deleteItemsError } = await supabase.from("order_items").delete().eq("order_id", validated.orderId);
  if (deleteItemsError) {
    return { error: deleteItemsError.message };
  }

  const { error: insertItemsError } = await supabase.from("order_items").insert(
    pricedItems.map((item) => {
      const serviceType = item.serviceType as keyof typeof SERVICE_CATEGORY_MAP;
      const serviceCategory = SERVICE_CATEGORY_MAP[serviceType];

      return {
        order_id: validated.orderId,
        service_type: serviceType,
        service_category: serviceCategory,
        unit_price: item.unitPrice,
        pages: serviceCategory === "printing" ? item.pages : null,
        copies: serviceCategory === "printing" ? item.copies : null,
        is_double_sided: serviceCategory === "printing" ? item.isDoubleSided : null,
        quantity: serviceCategory === "other" ? item.quantity : null,
        price: item.price
      };
    })
  );

  if (insertItemsError) {
    return { error: insertItemsError.message };
  }

  const paymentResult = await syncPaymentsForOrder(supabase, validated.orderId, validated.paymentStatus, totalPrice);
  if ("error" in paymentResult) {
    return { error: paymentResult.error };
  }

  const historyResult = await insertOrderHistory(supabase, {
    orderId: validated.orderId,
    action: "edited",
    reason: validated.reason,
    snapshot: previousSnapshot
  });

  if ("error" in historyResult) {
    return { error: historyResult.error };
  }

  refreshOrderViews(validated.orderId);

  return { success: true, orderId: validated.orderId };
}

export async function deleteOrderAction(payload: { orderId: string; reason: string }) {
  const validated = deleteOrderSchema.parse(payload);
  const supabase = await createSupabaseServerClient();
  const previousSnapshot = await getOrderSnapshot(supabase, validated.orderId);

  let { error: orderError } = await supabase
    .from("orders")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_reason: validated.reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", validated.orderId);

  if (orderError && hasSchemaCacheColumnError(orderError.message)) {
    const hardDelete = await supabase.from("orders").delete().eq("id", validated.orderId);
    orderError = hardDelete.error;
  }

  if (orderError) {
    return { error: orderError.message };
  }

  const historyResult = await insertOrderHistory(supabase, {
    orderId: validated.orderId,
    action: "deleted",
    reason: validated.reason,
    snapshot: previousSnapshot
  });

  if ("error" in historyResult) {
    return { error: historyResult.error };
  }

  refreshOrderViews(validated.orderId);

  return { success: true };
}

export async function markPaymentReceivedAction(payload: {
  orderId: string;
  amount: number;
  paymentMethod: "cash" | "upi" | "card" | "credit";
  reason?: string;
}) {
  const validated = paymentUpdateSchema.parse({
    ...payload,
    amount: Number(payload.amount)
  });
  const supabase = await createSupabaseServerClient();
  const previousSnapshot = await getOrderSnapshot(supabase, validated.orderId);
  const expectedAmount = Number((previousSnapshot as { total_price?: number } | null)?.total_price ?? 0);
  const amountChanged = Math.abs(validated.amount - expectedAmount) > 0.009;
  const reason = validated.reason?.trim() ?? "";

  if (amountChanged && reason.length < 2) {
    return { error: "Please add a short reason when the paid amount is different from the due amount." };
  }

  let { error: orderError } = await supabase
    .from("orders")
    .update({ payment_status: "paid", updated_at: new Date().toISOString() })
    .eq("id", validated.orderId);

  if (orderError && hasSchemaCacheColumnError(orderError.message)) {
    const retry = await supabase.from("orders").update({ payment_status: "paid" }).eq("id", validated.orderId);
    orderError = retry.error;
  }

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

  const historyResult = await insertOrderHistory(supabase, {
    orderId: validated.orderId,
    action: "payment_updated",
    reason: amountChanged
      ? `Marked paid via ${validated.paymentMethod}. Amount changed from ${expectedAmount} to ${validated.amount}. Reason: ${reason}`
      : `Marked paid via ${validated.paymentMethod}`,
    snapshot: previousSnapshot
  });

  if ("error" in historyResult) {
    return { error: historyResult.error };
  }

  refreshOrderViews(validated.orderId);

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

  revalidatePath("/");

  return { success: true };
}
