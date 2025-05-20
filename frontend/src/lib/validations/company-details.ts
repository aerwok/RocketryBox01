import * as z from "zod";

export const companyDetailsSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    sellerName: z.string().min(1, "Seller name is required"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
    brandName: z.string().optional(),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    supportContact: z.string().optional(),
    supportEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    operationsEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    financeEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    rechargeType: z.enum(["wallet", "credit_limit"]).default("wallet")
});

export type CompanyDetailsInput = z.infer<typeof companyDetailsSchema>; 