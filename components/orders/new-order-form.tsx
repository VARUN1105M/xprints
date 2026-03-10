"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/lib/actions";
import { DEPARTMENTS, OTHER_SERVICES, PRINTING_SERVICES, SECTIONS, SERVICE_TYPES, YEARS } from "@/lib/constants";
import { calculateTotalFromRate, getBillableUnits, isPrintingService, suggestPrice } from "@/lib/pricing";
import type { Customer } from "@/lib/types";
import { useFeedback } from "@/components/providers/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type DraftItem = {
  serviceType: (typeof SERVICE_TYPES)[number];
  unitPrice: number;
  pages: number;
  copies: number;
  isDoubleSided: boolean;
  quantity: number;
  price: number;
};

function createItem(): DraftItem {
  const serviceType: DraftItem["serviceType"] = "B&W Print";
  const unitPrice = 2;

  return {
    serviceType,
    unitPrice,
    pages: 1,
    copies: 1,
    isDoubleSided: false,
    quantity: 1,
    price: calculateTotalFromRate(serviceType, unitPrice, 1, 1, 1, false)
  };
}

export function NewOrderForm() {
  const router = useRouter();
  const { notify } = useFeedback();
  const [isPending, startTransition] = useTransition();
  const [customerName, setCustomerName] = useState("");
  const [department, setDepartment] = useState<(typeof DEPARTMENTS)[number]>("IT");
  const [year, setYear] = useState<(typeof YEARS)[number]>("I");
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("A");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [amountPaid, setAmountPaid] = useState(0);
  const [items, setItems] = useState<DraftItem[]>([createItem()]);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + Number(item.price), 0), [items]);

  async function loadSuggestions(value: string) {
    setCustomerName(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const response = await fetch(`/api/search?scope=customers&q=${encodeURIComponent(value)}`);
    const data = (await response.json()) as Customer[];
    setSuggestions(Array.isArray(data) ? data : []);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const next = { ...item, ...patch };
        return {
          ...next,
          price:
            patch.price ??
            calculateTotalFromRate(
              next.serviceType,
              Number(next.unitPrice),
              Number(next.copies),
              Number(next.quantity),
              Number(next.pages),
              next.isDoubleSided
            )
        };
      })
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await createOrderAction({
            customerName,
            department,
            year,
            section,
            paymentStatus,
            amountPaid,
            items
          });

          if (result?.error) {
            setMessage(result.error);
            notify({
              tone: "error",
              title: "Order was not saved",
              description: result.error
            });
            return;
          }

          setMessage("Saved to the live database.");
          notify({
            tone: "success",
            title: "Order saved",
            description: "The job was stored in Supabase and the order list has been updated."
          });
          router.push(`/orders?q=${result?.orderId}`);
        });
      }}
    >
      <div className="rounded-3xl border border-dashed p-4 text-sm text-muted-foreground">
        Rate is manual for each service line. The app only suggests a default value and then calculates total from your rate.
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <div className="space-y-2 md:col-span-4">
          <Label htmlFor="customerName">Customer name</Label>
          <div className="relative">
            <Input
              id="customerName"
              value={customerName}
              onChange={(event) => void loadSuggestions(event.target.value)}
              placeholder="Start typing to load an existing customer"
              required
            />
            {suggestions.length ? (
              <div className="absolute z-20 mt-2 w-full rounded-2xl border bg-card p-2 shadow-soft">
                {suggestions.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setCustomerName(customer.name);
                      setDepartment(customer.department);
                      setYear(customer.year);
                      setSection(customer.section);
                      setSuggestions([]);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-muted"
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
        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={department} onChange={(event) => setDepartment(event.target.value as (typeof DEPARTMENTS)[number])}>
            {DEPARTMENTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Year</Label>
          <Select value={year} onChange={(event) => setYear(event.target.value as (typeof YEARS)[number])}>
            {YEARS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Section</Label>
          <Select value={section} onChange={(event) => setSection(event.target.value as (typeof SECTIONS)[number])}>
            {SECTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Payment status</Label>
          <Select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as "paid" | "pending")}>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Services</h3>
            <p className="text-sm text-muted-foreground">Set the rate manually for each line and let the total compute automatically.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, createItem()])}>
            <Plus className="mr-2 h-4 w-4" />
            Add service
          </Button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => {
            const printing = isPrintingService(item.serviceType);
            const suggestedRate = suggestPrice(item.serviceType, 1, 1);
            const billableUnits = getBillableUnits(item.serviceType, item.copies, item.quantity, item.pages, item.isDoubleSided);

            return (
              <div key={`${item.serviceType}-${index}`} className="rounded-3xl border p-5">
                <div className="grid gap-4 lg:grid-cols-[1.1fr,0.7fr,0.7fr,0.85fr,0.85fr,0.7fr,0.9fr,0.95fr,auto]">
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select
                      value={item.serviceType}
                      onChange={(event) => {
                        const serviceType = event.target.value as DraftItem["serviceType"];
                        updateItem(index, {
                          serviceType,
                          unitPrice: suggestPrice(serviceType, 1, 1),
                          pages: 1,
                          copies: 1,
                          isDoubleSided: false,
                          quantity: 1
                        });
                      }}
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
                      <div className="space-y-2">
                        <Label>Pages each</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.pages}
                          onChange={(event) => updateItem(index, { pages: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Copies</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.copies}
                          onChange={(event) => updateItem(index, { copies: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Side</Label>
                        <Select
                          value={item.isDoubleSided ? "double" : "single"}
                          onChange={(event) => updateItem(index, { isDoubleSided: event.target.value === "double" })}
                        >
                          <option value="single">Single</option>
                          <option value="double">Double</option>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Units</Label>
                        <div className="flex h-10 items-center rounded-xl border px-3 text-sm text-muted-foreground">Quantity based</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Side</Label>
                        <div className="flex h-10 items-center rounded-xl border px-3 text-sm text-muted-foreground">Not used</div>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label>Suggested</Label>
                    <div className="flex h-10 items-center rounded-xl border px-3 text-sm">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Rs. {suggestedRate}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Units</Label>
                    <div className="flex h-10 items-center rounded-xl border px-3 text-sm">{billableUnits}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="flex h-10 items-center rounded-xl border px-3 text-sm font-semibold">Rs. {item.price}</div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Amount paid now</Label>
          <Input type="number" min={0} value={amountPaid} onChange={(event) => setAmountPaid(Number(event.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Order total</Label>
          <div className="flex h-10 items-center rounded-xl border px-3 text-sm font-semibold">Rs. {totalPrice}</div>
        </div>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving order..." : "Save order"}
      </Button>
    </form>
  );
}
