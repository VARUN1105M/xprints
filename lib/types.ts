export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Department = "IT" | "CSE" | "CSBS" | "ECE" | "CYBER" | "AIDS" | "EEE" | "CIVIL" | "MECH" | "BME" | "NIL";
export type Section = "A" | "B" | "NIL";
export type Year = "I" | "II" | "III" | "IV";
export type PaymentStatus = "paid" | "pending";
export type PaymentMethod = "cash" | "upi" | "card" | "credit";
export type ServiceCategory = "printing" | "other";
export type ServiceType =
  | "B&W Print"
  | "Color Print"
  | "Front Page"
  | "Record Print"
  | "Binding"
  | "Report Printing"
  | "Report Rework";

export type Customer = {
  id: string;
  name: string;
  department: Department;
  year: Year;
  section: Section;
  created_at: string;
};

export type Order = {
  id: string;
  customer_id: string;
  total_price: number;
  payment_status: PaymentStatus;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  service_type: ServiceType;
  service_category: ServiceCategory;
  unit_price: number | null;
  pages: number | null;
  copies: number | null;
  is_double_sided: boolean | null;
  quantity: number | null;
  price: number;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_date: string;
};

export type InventoryItem = {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  low_stock_limit: number;
};

export type Transaction = {
  id: string;
  inventory_id: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string;
  created_at: string;
};

export type OrderWithRelations = Order & {
  customers: Customer;
  order_items: OrderItem[];
  payments: Payment[];
};

export type DashboardMetrics = {
  todaysRevenue: number;
  ordersToday: number;
  totalCopiesPrinted: number;
  pendingPayments: number;
  otherServicesCount: number;
};

export type SearchResult = {
  type: "customer" | "order";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: Customer;
        Insert: {
          name: string;
          department: Department;
          year: Year;
          section: Section;
        };
        Update: {
          name?: string;
          department?: Department;
          year?: Year;
          section?: Section;
        };
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: {
          customer_id: string;
          total_price: number;
          payment_status: PaymentStatus;
        };
        Update: {
          customer_id?: string;
          total_price?: number;
          payment_status?: PaymentStatus;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: OrderItem;
        Insert: {
          order_id: string;
          service_type: ServiceType;
          service_category: ServiceCategory;
          unit_price?: number | null;
          pages?: number | null;
          copies?: number | null;
          is_double_sided?: boolean | null;
          quantity?: number | null;
          price: number;
        };
        Update: {
          order_id?: string;
          service_type?: ServiceType;
          service_category?: ServiceCategory;
          unit_price?: number | null;
          pages?: number | null;
          copies?: number | null;
          is_double_sided?: boolean | null;
          quantity?: number | null;
          price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: Payment;
        Insert: {
          order_id: string;
          amount: number;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          payment_date: string;
        };
        Update: {
          order_id?: string;
          amount?: number;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          payment_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory: {
        Row: InventoryItem;
        Insert: {
          item_name: string;
          category: string;
          quantity: number;
          unit: string;
          low_stock_limit: number;
        };
        Update: {
          item_name?: string;
          category?: string;
          quantity?: number;
          unit?: string;
          low_stock_limit?: number;
        };
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: {
          inventory_id: string;
          type: "IN" | "OUT";
          quantity: number;
          reason: string;
        };
        Update: {
          inventory_id?: string;
          type?: "IN" | "OUT";
          quantity?: number;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_inventory_id_fkey";
            columns: ["inventory_id"];
            isOneToOne: false;
            referencedRelation: "inventory";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
