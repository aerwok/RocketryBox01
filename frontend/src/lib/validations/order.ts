import { z } from "zod";

export const formSchema = z.object({
    // Pickup Address
    senderName: z.string().min(1, "Sender's name is required"),
    pickupMobile: z.string().min(10, "Mobile number must be 10 digits").max(10, "Mobile number must be 10 digits"),
    pickupAddress1: z.string().min(1, "Address line 1 is required"),
    pickupAddress2: z.string().optional(),
    pickupCity: z.string().min(1, "City is required"),
    pickupState: z.string().min(1, "State is required"),
    pickupPincode: z.string().min(6, "Pincode must be 6 digits").max(6, "Pincode must be 6 digits"),
    pickupSaveAddress: z.boolean(),

    // Delivery Address
    receiverName: z.string().min(1, "Receiver's name is required"),
    deliveryMobile: z.string().min(10, "Mobile number must be 10 digits").max(10, "Mobile number must be 10 digits"),
    deliveryAddress1: z.string().min(1, "Address line 1 is required"),
    deliveryAddress2: z.string().optional(),
    deliveryCity: z.string().min(1, "City is required"),
    deliveryState: z.string().min(1, "State is required"),
    deliveryPincode: z.string().min(6, "Pincode must be 6 digits").max(6, "Pincode must be 6 digits"),
    deliverySaveAddress: z.boolean(),

    // Package Details
    packaging: z.enum(["Pouch", "Box / Carton", "Suitcase / Luggage", "Backpack / Hand Bag", "Other"]),
    weight: z.string().min(1, "Weight is required"),
    content: z.string().min(1, "Package content is required"),
    value: z.string().min(1, "Package value is required"),
    length: z.string().min(1, "Length is required").regex(/^\d+$/, "Must be a number"),
    width: z.string().min(1, "Width is required").regex(/^\d+$/, "Must be a number"),
    height: z.string().min(1, "Height is required").regex(/^\d+$/, "Must be a number"),
    securePackage: z.boolean(),
    courierType: z.string().min(1, "Please select a courier").optional(),
});

export type CreateOrderInput = z.infer<typeof formSchema>;

export const warehouseBookingSchema = z.object({
    warehouse: z.string().min(1, "Warehouse is required"),
    rtoWarehouse: z.string().min(1, "RTO Warehouse is required"),
    shippingMode: z.string().min(1, "Shipping mode is required"),
    courier: z.string().optional(),
});

export type WarehouseBookingValues = z.infer<typeof warehouseBookingSchema>;

// Create a separate schema for final form submission that requires courierType
export const finalSubmitSchema = formSchema.extend({
    courierType: z.string().min(1, "Please select a courier"),
});
