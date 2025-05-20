import * as z from "zod";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const bankDetailsSchema = z.object({
    bankName: z.string().min(1, "Bank name is required"),
    accountName: z.string().min(1, "Account name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    branchName: z.string().min(1, "Branch name is required"),
    accountType: z.string().min(1, "Account type is required"),
    ifscCode: z.string().min(11, "IFSC code must be 11 characters").max(11, "IFSC code must be 11 characters"),
    cancelledChequeImage: z
        .instanceof(FileList)
        .refine((files) => files.length > 0, "Cancelled cheque image is required")
        .refine(
            (files) => files?.[0]?.size <= MAX_FILE_SIZE,
            "Max file size is 5MB"
        )
        .refine(
            (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
            "Only .pdf, .jpg, and .png files are accepted"
        ),
});

export type BankDetailsInput = z.infer<typeof bankDetailsSchema>; 