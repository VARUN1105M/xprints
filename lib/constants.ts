import { BookOpenText, ClipboardList, Layers3, ReceiptIndianRupee, Users2 } from "lucide-react";

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

export const FIXED_SERVICE_PRICING = {
  Binding: 20,
  "Report Printing": 60,
  "Report Rework": 30
} as const;

export const SIDEBAR_LINKS = [
  { href: "/orders/new", label: "New Order", icon: ReceiptIndianRupee },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Users2 },
  { href: "/unpaid", label: "Unpaid Jobs", icon: BookOpenText },
  { href: "/", label: "Pricing", icon: Layers3 }
] as const;
