import { DEFAULT_SERVICE_PRICING, PRINTING_SERVICES, SERVICE_CATEGORY_MAP, SERVICE_TYPES } from "@/lib/constants";

export type ServiceType = (typeof SERVICE_TYPES)[number];

export function isPrintingService(serviceType: ServiceType) {
  return PRINTING_SERVICES.includes(serviceType as (typeof PRINTING_SERVICES)[number]);
}

export function getSheetCount(pages: number, copies: number, isDoubleSided: boolean) {
  const safePages = Math.max(pages, 0);
  const safeCopies = Math.max(copies, 0);
  const sheetsPerCopy = isDoubleSided ? Math.ceil(safePages / 2) : safePages;

  return sheetsPerCopy * safeCopies;
}

export function getBillableUnits(
  serviceType: ServiceType,
  copies: number,
  quantity: number,
  pages = 1,
  isDoubleSided = false
) {
  const category = SERVICE_CATEGORY_MAP[serviceType];

  if (category === "printing") {
    return getSheetCount(pages, copies, isDoubleSided);
  }

  return Math.max(quantity, 1);
}

export function calculateTotalFromRate(
  serviceType: ServiceType,
  unitPrice: number,
  copies: number,
  quantity: number,
  pages = 1,
  isDoubleSided = false
) {
  return getBillableUnits(serviceType, copies, quantity, pages, isDoubleSided) * Math.max(unitPrice, 0);
}

export function suggestPrice(
  serviceType: ServiceType,
  copies: number,
  quantity: number,
  pages = 1,
  isDoubleSided = false
) {
  const basePrice = DEFAULT_SERVICE_PRICING[serviceType];
  return calculateTotalFromRate(serviceType, basePrice, copies, quantity, pages, isDoubleSided);
}
