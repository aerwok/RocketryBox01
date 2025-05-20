import * as z from "zod";

export const primaryAddressSchema = z.object({
    contactPersonName: z.string().min(1, "Contact person name is required"),
    contactPersonEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().min(1, "Address line 2 is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    pincode: z.string().min(6, "Pincode must be 6 digits"),
    addressType: z.string().min(1, "Address type is required"),
    landmark: z.string().optional(),
    isBillingAndPickup: z.boolean().default(false)
});

export type PrimaryAddressInput = z.infer<typeof primaryAddressSchema>; 