import * as z from "zod";

export const categories = [
    "ORDER",
    "PICKUP",
    "BILLING",
    "REMITTANCE",
    "WT_DISPUTE",
    "TECH",
    "CALLBACK",
    "KYC",
    "FINANCE"
] as const;

export const ticketFormSchema = z.object({
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    contactNumber: z
        .string()
        .regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, "Please enter a valid Indian phone number"),
    category: z.enum(categories, {
        required_error: "Please select a category",
    }),
    details: z.string().min(20, "Please provide more details (minimum 20 characters)"),
    attachments: z
        .instanceof(FileList)
        .refine((files) => files.length === 0 || files.length <= 5, "Maximum of 5 files are allowed")
        .refine(
            (files) => {
                for (let i = 0; i < files.length; i++) {
                    if (files[i].size > 5 * 1024 * 1024) return false; // 5MB
                }
                return true;
            },
            "Each file must be less than 5MB"
        )
        .optional(),
});

export type TicketFormValues = z.infer<typeof ticketFormSchema>; 