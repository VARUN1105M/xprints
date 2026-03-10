import { BookOpenText, ClipboardList, Layers3, Package2, ReceiptIndianRupee, Users2 } from "lucide-react";

export const DEPARTMENTS = [
  "IT",
  "CSE",
  "CSBS",
  "ECE",
  "CYBER",
  "AIDS",
  "EEE",
  "CIVIL",
  "MECH",
  "BME",
  "NIL"
] as const;

export const SECTIONS = ["A", "B", "NIL"] as const;
export const YEARS = ["I", "II", "III", "IV"] as const;

export const PRINTING_SERVICES = ["B&W Print", "Color Print", "Front Page", "Record Print"] as const;
export const OTHER_SERVICES = ["Binding", "Report Printing", "Report Rework"] as const;
export const SERVICE_TYPES = [...PRINTING_SERVICES, ...OTHER_SERVICES] as const;

export const SERVICE_CATEGORY_MAP: Record<(typeof SERVICE_TYPES)[number], "printing" | "other"> = {
  "B&W Print": "printing",
  "Color Print": "printing",
  "Front Page": "printing",
  "Record Print": "printing",
  Binding: "other",
  "Report Printing": "other",
  "Report Rework": "other"
};

export const DEFAULT_SERVICE_PRICING: Record<(typeof SERVICE_TYPES)[number], number> = {
  "B&W Print": 2,
  "Color Print": 10,
  "Front Page": 15,
  "Record Print": 5,
  Binding: 35,
  "Report Printing": 80,
  "Report Rework": 50
};

export const SIDEBAR_LINKS = [
  { href: "/", label: "Dashboard", icon: Layers3 },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/orders/new", label: "New Order", icon: ReceiptIndianRupee },
  { href: "/customers", label: "Customers", icon: Users2 },
  { href: "/unpaid", label: "Unpaid Jobs", icon: BookOpenText },
  { href: "/reports", label: "Reports", icon: ReceiptIndianRupee },
  { href: "/inventory", label: "Inventory", icon: Package2 }
] as const;
