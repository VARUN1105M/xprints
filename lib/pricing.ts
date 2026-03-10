import { FIXED_SERVICE_PRICING, PRINTING_SERVICES, SERVICE_CATEGORY_MAP, SERVICE_TYPES } from "@/lib/constants";

export type ServiceType = (typeof SERVICE_TYPES)[number];

export type Slab = {
  min: number;
  rate: number;
};

export const BW_SINGLE_SIDE_SLABS: Slab[] = [
  { min: 1, rate: 2 },
  { min: 10, rate: 1.5 },
  { min: 50, rate: 1.25 },
  { min: 100, rate: 1 }
];

export const BW_DOUBLE_SIDE_SLABS: Slab[] = [
  { min: 1, rate: 3 },
  { min: 10, rate: 2.5 },
  { min: 50, rate: 2 },
  { min: 100, rate: 1.8 }
];

export const COLOR_SINGLE_SIDE_SLABS: Slab[] = [
  { min: 1, rate: 10 },
  { min: 10, rate: 8 },
  { min: 50, rate: 6 },
  { min: 100, rate: 5 }
];

export const COLOR_DOUBLE_SIDE_SLABS: Slab[] = [
  { min: 1, rate: 15 },
  { min: 10, rate: 12 },
  { min: 50, rate: 10 },
  { min: 100, rate: 8 }
];

export type PricingDetails = {
  unitRate: number;
  billableUnits: number;
  total: number;
  unitLabel: string;
  pricingText: string;
  summary: string;
};

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

function getSlabRate(slabs: Slab[], units: number) {
  const safeUnits = Math.max(units, 1);

  for (let index = slabs.length - 1; index >= 0; index -= 1) {
    if (safeUnits >= slabs[index].min) {
      return slabs[index].rate;
    }
  }

  return slabs[0]?.rate ?? 0;
}

function isColorService(serviceType: ServiceType) {
  return serviceType === "Color Print" || serviceType === "Front Page";
}

function isBlackAndWhiteService(serviceType: ServiceType) {
  return serviceType === "B&W Print" || serviceType === "Record Print";
}

export function getPricingDetails(
  serviceType: ServiceType,
  copies: number,
  quantity: number,
  pages = 1,
  isDoubleSided = false
): PricingDetails {
  const billableUnits = getBillableUnits(serviceType, copies, quantity, pages, isDoubleSided);

  if (isBlackAndWhiteService(serviceType) || isColorService(serviceType)) {
    const slabs = isColorService(serviceType)
      ? isDoubleSided
        ? COLOR_DOUBLE_SIDE_SLABS
        : COLOR_SINGLE_SIDE_SLABS
      : isDoubleSided
        ? BW_DOUBLE_SIDE_SLABS
        : BW_SINGLE_SIDE_SLABS;
    const unitRate = getSlabRate(slabs, billableUnits);
    const total = Math.round(billableUnits * unitRate);
    const unitLabel = isDoubleSided ? "sheet" : "page";
    const sideLabel = isDoubleSided ? "double side" : "single side";

    return {
      unitRate,
      billableUnits,
      total,
      unitLabel,
      pricingText: `Rs ${unitRate} / ${unitLabel}`,
      summary: `${sideLabel} ${isColorService(serviceType) ? "color" : "black & white"} pricing`
    };
  }

  const unitRate = FIXED_SERVICE_PRICING[serviceType as keyof typeof FIXED_SERVICE_PRICING] ?? 0;

  return {
    unitRate,
    billableUnits,
    total: Math.round(billableUnits * unitRate),
    unitLabel: "item",
    pricingText: `Rs ${unitRate} / item`,
    summary: "fixed service pricing"
  };
}

export function suggestPrice(
  serviceType: ServiceType,
  copies: number,
  quantity: number,
  pages = 1,
  isDoubleSided = false
) {
  return getPricingDetails(serviceType, copies, quantity, pages, isDoubleSided).total;
}
