import { FIXED_SERVICE_PRICING } from "@/lib/constants";
import {
  BW_DOUBLE_SIDE_SLABS,
  BW_SINGLE_SIDE_SLABS,
  COLOR_DOUBLE_SIDE_SLABS,
  COLOR_SINGLE_SIDE_SLABS,
  type Slab
} from "@/lib/pricing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PriceRow = {
  slab: string;
  price: string;
  note?: string;
};

function formatRate(rate: number) {
  return Number.isInteger(rate) ? rate.toFixed(0) : rate.toFixed(2);
}

function buildSlabRows(slabs: Slab[], rangeUnitLabel: "page" | "sheet", priceUnitLabel: "page" | "sheet") {
  return slabs.map((slab) => {
    const slabLabel =
      typeof slab.max === "number"
        ? `${slab.min}-${slab.max} ${rangeUnitLabel}${slab.max > 1 ? "s" : ""}`
        : `${slab.min}+ ${rangeUnitLabel}${slab.min === 1 ? "" : "s"}`;

    return {
      slab: slabLabel,
      price: `Rs ${formatRate(slab.rate)} / ${priceUnitLabel}`
    };
  });
}

const bwSingleSide = buildSlabRows(BW_SINGLE_SIDE_SLABS, "page", "page");
const bwDoubleSide = buildSlabRows(BW_DOUBLE_SIDE_SLABS, "page", "sheet");
const colorSingleSide = buildSlabRows(COLOR_SINGLE_SIDE_SLABS, "page", "page");
const colorDoubleSide = buildSlabRows(COLOR_DOUBLE_SIDE_SLABS, "page", "sheet");

const fixedServiceRows: PriceRow[] = [
  { slab: "Binding", price: `Rs ${FIXED_SERVICE_PRICING.Binding} / item` },
  { slab: "Report Printing", price: `Rs ${FIXED_SERVICE_PRICING["Report Printing"]} / item` },
  { slab: "Report Rework", price: `Rs ${FIXED_SERVICE_PRICING["Report Rework"]} / item` }
];

function PricingTable({ rows }: { rows: PriceRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={`${row.slab}-${row.price}`} className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
          <p className="font-medium">{row.slab}</p>
          <p className="text-right font-semibold">{row.price}</p>
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Black &amp; white single side</CardTitle>
          <CardDescription>Per-page pricing for B&amp;W Print and Record Print.</CardDescription>
        </CardHeader>
        <CardContent>
          <PricingTable rows={bwSingleSide} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Black &amp; white double side</CardTitle>
          <CardDescription>Rate is chosen by total pages and charged per sheet.</CardDescription>
        </CardHeader>
        <CardContent>
          <PricingTable rows={bwDoubleSide} />
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Color printing</CardTitle>
          <CardDescription>Single-side is per page; double-side rate is chosen by total pages and charged per sheet.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Single side color</p>
            <PricingTable rows={colorSingleSide} />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Double side color</p>
            <PricingTable rows={colorDoubleSide} />
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Other services</CardTitle>
          <CardDescription>Fixed item pricing used by Binding, Report Printing, and Report Rework.</CardDescription>
        </CardHeader>
        <CardContent>
          <PricingTable rows={fixedServiceRows} />
        </CardContent>
      </Card>
    </div>
  );
}
