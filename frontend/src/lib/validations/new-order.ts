import * as z from "zod";

const itemSchema = z.object({
  sku: z.string().optional().or(z.literal("")),
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  itemWeight: z.coerce.number().min(0.01, "Weight must be at least 0.01"),
  itemPrice: z.coerce.number().min(0.01, "Price must be at least 0.01"),
});

export const newOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  shipmentType: z.enum(["FORWARD", "REVERSE"]),
  paymentType: z.enum(["COD", "PAID"]),

  // Shipping Details
  fullName: z.string().min(1, "Full name is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),

  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  landmark: z.string().optional().or(z.literal("")),
  pincode: z.string().min(1, "Pincode is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),

  // Item Details - now supports multiple items
  items: z.array(itemSchema),

  // Form fields for current item being added
  sku: z.string().optional().or(z.literal("")),
  itemName: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().optional(),
  itemWeight: z.coerce.number().optional(),
  itemPrice: z.coerce.number().optional(),

  // Charges
  shippingCharge: z.coerce.number().min(0),
  codCharge: z.coerce.number().min(0),
  taxAmount: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  collectibleAmount: z.coerce.number().min(0).optional(),

  // Package Dimensions
  length: z.coerce.number().min(0.1, "Length must be at least 0.1").optional(),
  width: z.coerce.number().min(0.1, "Width must be at least 0.1").optional(),
  height: z.coerce.number().min(0.1, "Height must be at least 0.1").optional(),
  weight: z.coerce.number().min(0.1, "Weight must be at least 0.1").optional(),
  totalAmount: z.coerce.number().min(0),

  // Shipping Options
  courier: z.string().optional(),
  warehouse: z.string().optional(),
  rtoWarehouse: z.string().optional(),
  shippingMode: z.string().optional(),
});

export type NewOrderInput = z.infer<typeof newOrderSchema>;
