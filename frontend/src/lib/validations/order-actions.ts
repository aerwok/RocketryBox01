import * as z from "zod";

export const returnOrderSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    returnReason: z.string().min(1, "Return reason is required"),
    returnType: z.enum(["REFUND", "REPLACEMENT"], {
        required_error: "Return type is required",
    }),
    description: z.string().optional().or(z.literal("")),
    images: z.array(z.string()).optional(),
});

export const reattemptOrderSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    fullName: z.string().min(1, "Full name is required"),
    contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional().or(z.literal("")),
    landmark: z.string().optional().or(z.literal("")),
    pincode: z.string().min(1, "Pincode is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    reattemptReason: z.string().min(1, "Reattempt reason is required"),
});

export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;
export type ReattemptOrderInput = z.infer<typeof reattemptOrderSchema>; 