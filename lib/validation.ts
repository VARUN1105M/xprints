import { z } from "zod";
import { DEPARTMENTS, SECTIONS, SERVICE_TYPES, YEARS } from "@/lib/constants";

export const orderItemSchema = z
  .object({
    serviceType: z.enum(SERVICE_TYPES),
    unitPrice: z.number().min(0),
    pages: z.number().int().min(0),
    copies: z.number().int().min(0),
    isDoubleSided: z.boolean(),
    quantity: z.number().int().min(0),
    price: z.number().min(0)
  })
  .superRefine((item, ctx) => {
    const isPrinting = ["B&W Print", "Color Print", "Front Page", "Record Print"].includes(item.serviceType);
    if (isPrinting && item.pages <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Printing services require pages"
      });
    }
    if (isPrinting && item.copies <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Printing services require copies"
      });
    }
    if (!isPrinting && item.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Other services require quantity"
      });
    }
  });

export const createOrderSchema = z.object({
  customerName: z.string().min(2),
  department: z.enum(DEPARTMENTS),
  year: z.enum(YEARS),
  section: z.enum(SECTIONS),
  paymentStatus: z.enum(["paid", "pending"]),
  amountPaid: z.number().min(0),
  items: z.array(orderItemSchema).min(1)
});

export const paymentUpdateSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().min(0),
  paymentMethod: z.enum(["cash", "upi", "card", "credit"])
});

export const inventoryAdjustmentSchema = z.object({
  inventoryId: z.string().uuid(),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().min(1),
  reason: z.string().min(2)
});
