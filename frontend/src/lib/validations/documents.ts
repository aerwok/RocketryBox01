import * as z from "zod";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const documentsSchema = z.object({
    companyCategory: z.string().min(1, "Company category is required"),
    panNumber: z.string().min(10, "PAN number is required").max(10, "PAN number must be 10 characters"),
    panImage: z.instanceof(FileList).refine((files) => files.length > 0, "PAN image is required"),
    gstNumber: z.string().optional(),
    gstDocument: z.instanceof(FileList).optional(),
    identityDocument: z.string().min(1, "Identity document type is required"),
    documentNumber: z.string().min(1, "Document number is required"),
    gstDocumentImage: z.instanceof(FileList).optional(),
    gst: z.any()
        .refine((file) => file?.length === 1, "GST certificate is required")
        .refine(
            (file) => file?.[0]?.size <= MAX_FILE_SIZE,
            "Max file size is 5MB"
        )
        .refine(
            (file) => ACCEPTED_FILE_TYPES.includes(file?.[0]?.type),
            "Only .pdf, .jpg, and .png files are accepted"
        ),
    pan: z.any()
        .refine((file) => file?.length === 1, "PAN card is required")
        .refine(
            (file) => file?.[0]?.size <= MAX_FILE_SIZE,
            "Max file size is 5MB"
        )
        .refine(
            (file) => ACCEPTED_FILE_TYPES.includes(file?.[0]?.type),
            "Only .pdf, .jpg, and .png files are accepted"
        ),
    addressProof: z.any()
        .refine((file) => file?.length === 1, "Address proof is required")
        .refine(
            (file) => file?.[0]?.size <= MAX_FILE_SIZE,
            "Max file size is 5MB"
        )
        .refine(
            (file) => ACCEPTED_FILE_TYPES.includes(file?.[0]?.type),
            "Only .pdf, .jpg, and .png files are accepted"
        ),
    cancelledCheque: z.any()
        .refine((file) => file?.length === 1, "Cancelled cheque is required")
        .refine(
            (file) => file?.[0]?.size <= MAX_FILE_SIZE,
            "Max file size is 5MB"
        )
        .refine(
            (file) => ACCEPTED_FILE_TYPES.includes(file?.[0]?.type),
            "Only .pdf, .jpg, and .png files are accepted"
        ),
});

export type DocumentsInput = z.infer<typeof documentsSchema>; 