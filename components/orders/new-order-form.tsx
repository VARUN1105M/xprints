"use client";

import { Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction, updateOrderAction } from "@/lib/actions";
import { DEPARTMENTS, OTHER_SERVICES, PRINTING_SERVICES, SERVICE_TYPES, SECTIONS, YEARS } from "@/lib/constants";
import { appendLocalOrderHistory } from "@/lib/local-order-history";
import { getPricingDetails, isPrintingService } from "@/lib/pricing";
import type { Customer, OrderHistory } from "@/lib/types";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DraftItem = {
  serviceType: (typeof SERVICE_TYPES)[number];
  unitPrice: number;
  pages: number;
  copies: number;
  isDoubleSided: boolean;
  quantity: number;
  price: number;
};

export type ExistingOrderInput = {
  orderId: string;
  customerName: string;
  department: (typeof DEPARTMENTS)[number];
  year: (typeof YEARS)[number];
  section: (typeof SECTIONS)[number];
  paymentStatus: "paid" | "pending";
  items: DraftItem[];
};

const SERVICE_NOTES: Record<(typeof SERVICE_TYPES)[number], string> = {
  "B&W Print": "Best for assignments and everyday print jobs.",
  "Color Print": "Use for color charts, certificates, and premium printouts.",
  "Front Page": "Treated as color printing with the current slab rate.",
  "Record Print": "Uses the black and white print slabs for record work.",
  Binding: "Fixed service price for spiral binding.",
  "Report Printing": "Fixed package price for bundled report work.",
  "Report Rework": "Fixed service price for corrections and rework."
};

function createItem(serviceType: DraftItem["serviceType"] = "B&W Print"): DraftItem {
  const pricing = getPricingDetails(serviceType, 1, 1, 1, false);

  return {
    serviceType,
    unitPrice: pricing.unitRate,
    pages: 1,
    copies: 1,
    isDoubleSided: false,
    quantity: 1,
    price: pricing.total
  };
}

function syncPricing(item: DraftItem): DraftItem {
  const pricing = getPricingDetails(item.serviceType, item.copies, item.quantity, item.pages, item.isDoubleSided);
  return {
    ...item,
    unitPrice: pricing.unitRate,
    price: pricing.total
  };
}

function getPricingBasisText(item: DraftItem, billableUnits: number) {
  if (!isPrintingService(item.serviceType)) {
    return `${billableUnits} billed item${billableUnits > 1 ? "s" : ""}`;
  }

  if (item.isDoubleSided) {
    const rangeUnits = item.pages * item.copies;
    return `${rangeUnits} total pages set the rate; ${billableUnits} billed sheet${billableUnits > 1 ? "s" : ""}`;
  }

  return `${item.pages} pages x ${item.copies} cop${item.copies > 1 ? "ies" : "y"} = ${billableUnits} billed page${billableUnits > 1 ? "s" : ""}`;
}

function StepperField({
  label,
  value,
  onChange,
  min = 1
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2 rounded-2xl border bg-background p-1">
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(Math.max(min, value - 1))}>
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          min={min}
          value={value}
          onChange={(event) => onChange(Math.max(min, Number(event.target.value) || min))}
          className="h-10 border-0 text-center shadow-none focus-visible:ring-0"
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(value + 1)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function NewOrderForm({
  mode = "create",
  initialOrder,
  history = []
}: {
  mode?: "create" | "edit";
  initialOrder?: ExistingOrderInput;
  history?: OrderHistory[];
}) {
  const router = useRouter();
  const { notify } = useFeedback();
  const [isPending, startTransition] = useTransition();
  const [customerName, setCustomerName] = useState(initialOrder?.customerName ?? "");
  const [department, setDepartment] = useState<(typeof DEPARTMENTS)[number]>(initialOrder?.department ?? "IT");
  const [year, setYear] = useState<(typeof YEARS)[number]>(initialOrder?.year ?? "I");
  const [section, setSection] = useState<(typeof SECTIONS)[number]>(initialOrder?.section ?? "A");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">(initialOrder?.paymentStatus ?? "pending");
  const [items, setItems] = useState<DraftItem[]>(initialOrder?.items?.length ? initialOrder.items.map(syncPricing) : [createItem()]);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + Number(item.price), 0), [items]);
  const amountPaid = paymentStatus === "paid" ? totalPrice : 0;
  const balanceDue = paymentStatus === "paid" ? 0 : totalPrice;

  function applyCustomer(customer: Customer) {
    setCustomerName(customer.name);
    setDepartment(customer.department);
    setYear(customer.year);
    setSection(customer.section);
    setMatchedCustomer(customer);
    setSuggestions([]);
  }

  async function loadSuggestions(value: string) {
    setCustomerName(value);
    setMatchedCustomer((current) => (current?.name.toLowerCase() === value.trim().toLowerCase() ? current : null));

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const response = await fetch(`/api/search?scope=customers&q=${encodeURIComponent(value)}`);
    const data = (await response.json()) as Customer[];
    const customerMatches = Array.isArray(data) ? data : [];
    setSuggestions(customerMatches);

    const exactMatch = customerMatches.find((customer) => customer.name.trim().toLowerCase() === value.trim().toLowerCase());
    if (exactMatch) {
      applyCustomer(exactMatch);
    }
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return syncPricing({ ...item, ...patch });
      })
    );
  }

  return (
    <form
      className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);

        startTransition(async () => {
          const actionPayload = {
            customerName,
            department,
            year,
            section,
            paymentStatus,
            amountPaid,
            items
          };

          const result =
            mode === "edit" && initialOrder
              ? await updateOrderAction({
                  ...actionPayload,
                  orderId: initialOrder.orderId,
                  reason
                })
              : await createOrderAction(actionPayload);

          if (result?.error) {
            setMessage(result.error);
            notify({
              tone: "error",
              title: mode === "edit" ? "Order update failed" : "Order was not saved",
              description: result.error
            });
            return;
          }

          setMessage(mode === "edit" ? "Order updated successfully." : "Order saved successfully.");
          if (mode === "edit" && initialOrder) {
            appendLocalOrderHistory({
              id: `${initialOrder.orderId}-${Date.now()}`,
              orderId: initialOrder.orderId,
              customerName,
              action: "edited",
              reason,
              createdAt: new Date().toISOString()
            });
          }
          notify({
            tone: "success",
            title: mode === "edit" ? "Order updated" : "Order saved",
            description: mode === "edit" ? "The order and its history were updated." : "The new order is live in the database."
          });
          router.push(`/orders?q=${result?.orderId}`);
        });
      }}
    >
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer name</Label>
              <div className="relative">
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(event) => void loadSuggestions(event.target.value)}
                  placeholder="Type the name to fetch an existing customer"
                  className="h-12 rounded-2xl"
                  required
                />
                {suggestions.length ? (
                  <div className="absolute z-20 mt-2 w-full rounded-2xl border bg-card p-2 shadow-soft">
                    {suggestions.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => applyCustomer(customer)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-muted"
                      >
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {customer.department} - {customer.year} - {customer.section}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Department</p>
                <Select value={department} onChange={(event) => setDepartment(event.target.value as (typeof DEPARTMENTS)[number])} className="mt-3 h-11 rounded-2xl">
                  {DEPARTMENTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="rounded-[1.5rem] border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Year</p>
                <Select value={year} onChange={(event) => setYear(event.target.value as (typeof YEARS)[number])} className="mt-3 h-11 rounded-2xl">
                  {YEARS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="rounded-[1.5rem] border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Section</p>
                <Select value={section} onChange={(event) => setSection(event.target.value as (typeof SECTIONS)[number])} className="mt-3 h-11 rounded-2xl">
                  {SECTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {matchedCustomer ? (
              <div className="rounded-[1.5rem] border bg-background p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <p className="font-medium">Existing customer found</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {matchedCustomer.name} - {matchedCustomer.department} - {matchedCustomer.year} - {matchedCustomer.section}
                </p>
              </div>
            ) : null}

            {mode === "edit" ? (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for edit</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain why this order is being edited"
                  className="min-h-[96px] rounded-2xl"
                  required
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Services</CardTitle>
              <CardDescription>Every service line follows the pricing structure automatically.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, createItem()])}>
              <Plus className="mr-2 h-4 w-4" />
              Add service
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => {
              const printing = isPrintingService(item.serviceType);
              const pricing = getPricingDetails(item.serviceType, item.copies, item.quantity, item.pages, item.isDoubleSided);
              const pricingBasisText = getPricingBasisText(item, pricing.billableUnits);

              return (
                <div key={`${item.serviceType}-${index}`} className="rounded-[1.75rem] border bg-muted/20 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Service line {index + 1}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{SERVICE_NOTES[item.serviceType]}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,0.8fr,0.8fr,0.9fr]">
                    <div className="space-y-2 lg:col-span-2">
                      <Label>Service type</Label>
                      <Select
                        value={item.serviceType}
                        onChange={(event) => updateItem(index, createItem(event.target.value as DraftItem["serviceType"]))}
                        className="h-12 rounded-2xl"
                      >
                        <optgroup label="Printing services">
                          {PRINTING_SERVICES.map((service) => (
                            <option key={service} value={service}>
                              {service}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Other services">
                          {OTHER_SERVICES.map((service) => (
                            <option key={service} value={service}>
                              {service}
                            </option>
                          ))}
                        </optgroup>
                      </Select>
                    </div>

                    {printing ? (
                      <>
                        <StepperField label="Pages each" value={item.pages} onChange={(next) => updateItem(index, { pages: next })} />
                        <StepperField label="Copies" value={item.copies} onChange={(next) => updateItem(index, { copies: next })} />
                      </>
                    ) : (
                      <div className="lg:col-span-2">
                        <StepperField label="Quantity" value={item.quantity} onChange={(next) => updateItem(index, { quantity: next })} />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,0.9fr,0.9fr]">
                    <div className="rounded-[1.5rem] border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Applied pricing</p>
                      <p className="mt-3 text-lg font-semibold">{pricing.pricingText}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{pricing.summary}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{pricingBasisText}</p>
                    </div>

                    {printing ? (
                      <div className="rounded-[1.5rem] border bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Print side</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={item.isDoubleSided ? "outline" : "default"}
                            onClick={() => updateItem(index, { isDoubleSided: false })}
                            className="rounded-2xl"
                          >
                            Single side
                          </Button>
                          <Button
                            type="button"
                            variant={item.isDoubleSided ? "default" : "outline"}
                            onClick={() => updateItem(index, { isDoubleSided: true })}
                            className="rounded-2xl"
                          >
                            Double side
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[1.5rem] border bg-background p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Billing basis</p>
                        <p className="mt-3 text-lg font-semibold">Fixed service</p>
                        <p className="mt-2 text-sm text-muted-foreground">This line uses a flat price per item.</p>
                      </div>
                    )}

                    <div className="rounded-[1.5rem] border bg-foreground p-4 text-background">
                      <p className="text-xs uppercase tracking-[0.24em] text-background/70">Line total</p>
                      <p className="mt-3 text-3xl font-semibold">Rs {item.price}</p>
                      <p className="mt-2 text-sm text-background/80">
                        {pricing.billableUnits} {pricing.unitLabel}
                        {pricing.billableUnits > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>Set whether this order is paid or still pending.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={paymentStatus === "paid" ? "default" : "outline"}
                className="rounded-2xl"
                onClick={() => setPaymentStatus("paid")}
              >
                Paid
              </Button>
              <Button
                type="button"
                variant={paymentStatus === "pending" ? "default" : "outline"}
                className="rounded-2xl"
                onClick={() => setPaymentStatus("pending")}
              >
                Pending
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>Order summary</CardTitle>
            <CardDescription>Review the pricing-driven total before saving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {items.map((item, index) => (
              <div key={`${item.serviceType}-summary-${index}`} className="flex items-start justify-between gap-3 rounded-2xl border px-4 py-3">
                <div>
                  <p className="font-medium">{item.serviceType}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPrintingService(item.serviceType)
                      ? `${item.pages} pages x ${item.copies} copies`
                      : `${item.quantity} item${item.quantity > 1 ? "s" : ""}`}
                  </p>
                </div>
                <p className="font-semibold">Rs {item.price}</p>
              </div>
            ))}

            <div className="rounded-[1.75rem] border bg-foreground p-5 text-background">
              <div className="flex items-center justify-between text-sm text-background/75">
                <span>Total</span>
                <span>Rs {totalPrice}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-background/75">
                <span>Status</span>
                <span>{paymentStatus === "paid" ? "Paid" : "Pending"}</span>
              </div>
              <div className="mt-4 border-t border-background/15 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-background/75">Balance due</span>
                  <span className="text-3xl font-semibold">Rs {balanceDue}</span>
                </div>
              </div>
            </div>

            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <Button type="submit" disabled={isPending} className="h-12 w-full rounded-2xl text-base">
              {isPending ? (mode === "edit" ? "Updating order..." : "Saving order...") : mode === "edit" ? "Update order" : "Save order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
