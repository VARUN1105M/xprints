import { startOfDay } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Customer,
  DashboardMetrics,
  InventoryItem,
  OrderItem,
  OrderWithRelations,
  SearchResult
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { getPagination } from "@/lib/pagination";

export async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  return { supabase, user };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { supabase } = await requireAdminUser();
  const today = startOfDay(new Date()).toISOString();

  const [{ data: ordersToday }, { count: pendingCount }, { data: paymentsToday }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total_price, created_at, order_items(pages, copies, quantity, service_category)")
      .gte("created_at", today),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
    supabase.from("payments").select("amount, payment_date, payment_status").eq("payment_status", "paid").gte("payment_date", today)
  ]);

  const metrics = (ordersToday ?? []).reduce<DashboardMetrics>(
    (acc, order) => {
      const items = (order.order_items ?? []) as Pick<OrderItem, "pages" | "copies" | "quantity" | "service_category">[];

      acc.ordersToday += 1;
      acc.totalCopiesPrinted += items.reduce((sum, item) => sum + (item.pages ?? 0) * (item.copies ?? 0), 0);
      acc.otherServicesCount += items
        .filter((item) => item.service_category === "other")
        .reduce((sum, item) => sum + (item.quantity ?? 0), 0);

      return acc;
    },
    {
      todaysRevenue: (paymentsToday ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0),
      ordersToday: 0,
      totalCopiesPrinted: 0,
      pendingPayments: pendingCount ?? 0,
      otherServicesCount: 0
    }
  );

  return metrics;
}

export async function getRecentOrders(limit = 8) {
  const { supabase } = await requireAdminUser();
  const { data } = await supabase
    .from("orders")
    .select("*, customers(*), order_items(*), payments(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as OrderWithRelations[]) ?? [];
}

export async function getCustomers(params: {
  page?: number;
  search?: string;
  department?: string;
  selectedCustomerId?: string;
}) {
  const { supabase } = await requireAdminUser();
  const search = params.search?.trim();
  const pagination = getPagination(params.page ?? 1, 10);

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (params.department && params.department !== "ALL") {
    query = query.eq("department", params.department);
  }

  const { data, count } = await query.range(pagination.from, pagination.to);

  let history: OrderWithRelations[] = [];
  if (params.selectedCustomerId) {
    const { data: historyData } = await supabase
      .from("orders")
      .select("*, customers(*), order_items(*), payments(*)")
      .eq("customer_id", params.selectedCustomerId)
      .order("created_at", { ascending: false })
      .limit(10);

    history = (historyData ?? []) as unknown as OrderWithRelations[];
  }

  return {
    customers: (data ?? []) as Customer[],
    total: count ?? 0,
    history
  };
}

export async function getOrders(params: {
  page?: number;
  search?: string;
  paymentStatus?: string;
}) {
  const { supabase } = await requireAdminUser();
  const pagination = getPagination(params.page ?? 1, 10);

  const { data } = await supabase
    .from("orders")
    .select("*, customers(*), order_items(*), payments(*)")
    .order("created_at", { ascending: false });

  let filtered = ((data ?? []) as unknown as OrderWithRelations[]) ?? [];

  if (params.search?.trim()) {
    const search = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (order) =>
        order.id.toLowerCase().includes(search) ||
        order.customers.name.toLowerCase().includes(search) ||
        order.customers.department.toLowerCase().includes(search)
    );
  }

  if (params.paymentStatus && params.paymentStatus !== "ALL") {
    filtered = filtered.filter((order) => order.payment_status === params.paymentStatus);
  }

  const paginated = filtered.slice(pagination.from, pagination.to + 1);

  return {
    orders: paginated,
    total: filtered.length
  };
}

export async function getUnpaidOrders(page = 1) {
  return getOrders({ page, paymentStatus: "pending" });
}

export async function getInventory() {
  const { supabase } = await requireAdminUser();
  const [{ data: inventory }, { data: transactions }] = await Promise.all([
    supabase.from("inventory").select("*").order("item_name"),
    supabase.from("transactions").select("*, inventory(*)").order("created_at", { ascending: false }).limit(12)
  ]);

  return {
    inventory: (inventory ?? []) as InventoryItem[],
    transactions: transactions ?? []
  };
}

export async function getReportsData() {
  const { supabase } = await requireAdminUser();

  const [{ data: orders }, { data: orderItems }] = await Promise.all([
    supabase.from("orders").select("*, customers(*)").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*, orders(created_at, customer_id, customers(department))")
  ]);

  const departmentUsage = new Map<string, number>();
  const otherServicesUsage = new Map<string, number>();
  const dailyRevenue = new Map<string, number>();

  ((orders ?? []) as unknown as OrderWithRelations[]).forEach((order) => {
    const day = new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    dailyRevenue.set(day, (dailyRevenue.get(day) ?? 0) + Number(order.total_price));
  });

  ((orderItems ?? []) as Array<OrderItem & { orders?: { customers?: { department?: string } } }>).forEach((item) => {
    const department = item.orders?.customers?.department ?? "NIL";
    if (item.service_category === "printing") {
      departmentUsage.set(department, (departmentUsage.get(department) ?? 0) + (item.pages ?? 0) * (item.copies ?? 0));
    } else {
      otherServicesUsage.set(item.service_type, (otherServicesUsage.get(item.service_type) ?? 0) + (item.quantity ?? 0));
    }
  });

  return {
    departmentUsage: Array.from(departmentUsage.entries()).map(([department, total]) => ({ department, total })),
    otherServicesUsage: Array.from(otherServicesUsage.entries()).map(([service, total]) => ({ service, total })),
    dailyRevenue: Array.from(dailyRevenue.entries()).map(([date, total]) => ({
      date,
      total,
      label: formatCurrency(total)
    }))
  };
}

export async function getCustomerSuggestions(query: string) {
  if (!query.trim()) {
    return [];
  }

  const { supabase } = await requireAdminUser();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .ilike("name", `%${query.trim()}%`)
    .order("created_at", { ascending: false })
    .limit(6);

  return (data ?? []) as Customer[];
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const term = query.trim();
  if (!term) {
    return [];
  }

  const { supabase } = await requireAdminUser();

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("*").ilike("name", `%${term}%`).limit(5),
    supabase.from("orders").select("*, customers(*)").order("created_at", { ascending: false }).limit(12)
  ]);

  const orderMatches = ((orders ?? []) as unknown as OrderWithRelations[])
    .filter(
      (order) =>
        order.id.toLowerCase().includes(term.toLowerCase()) ||
        order.customers.name.toLowerCase().includes(term.toLowerCase())
    )
    .slice(0, 5);

  return [
    ...((customers ?? []) as Customer[]).map((customer) => ({
      type: "customer" as const,
      id: customer.id,
      title: customer.name,
      subtitle: `${customer.department} - ${customer.year} - ${customer.section}`,
      href: `/customers?customerId=${customer.id}`
    })),
    ...orderMatches.map((order) => ({
      type: "order" as const,
      id: order.id,
      title: `Order ${order.id.slice(0, 8)}`,
      subtitle: `${order.customers.name} - ${formatCurrency(Number(order.total_price))}`,
      href: `/orders?q=${order.id}`
    }))
  ];
}
