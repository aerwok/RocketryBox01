import * as z from "zod";

export const companyDetailsSchema = z.object({
  companyCategory: z.string().min(1, "Company category is required"),
  companyName: z.string().min(1, "Company name is required"),
  sellerName: z.string().min(1, "Seller name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits")
});

export const documentsSchema = z.object({
  panNumber: z.string().min(10, "PAN number must be 10 characters").max(10, "PAN number must be 10 characters"),
  panImage: z.any().optional(),
  gstNumber: z.string().optional(),
  gstDocument: z.any().optional(),
  documentType: z.string().min(1, "Document type is required"),
  documentNumber: z.string().min(1, "Document number is required"),
  identityDocumentImage: z.any().optional()
});

export const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string()
    .min(9, "Account number must be at least 9 digits")
    .max(18, "Account number cannot exceed 18 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  branchName: z.string().min(1, "Branch name is required"),
  ifscCode: z.string()
    .length(11, "IFSC code must be exactly 11 characters")
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format (e.g., SBIN0001234)"),
  cancelledChequeImage: z.instanceof(File).optional(),
});

export const paymentTypeSchema = z.object({
  paymentMode: z.string().min(1, "Payment mode is required"),
  rateBand: z.string().min(1, "Rate band is required")
});

export const documentApprovalSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  remarks: z.string().optional()
});

export const sellerLoginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required")
});

export const documentVerificationSchema = z.object({
  status: z.enum(["verified", "rejected"], {
    required_error: "Status is required",
    invalid_type_error: "Status must be either verified or rejected"
  }),
  remarks: z.string().optional()
});

export type CompanyDetailsInput = z.infer<typeof companyDetailsSchema>;
export type DocumentsInput = z.infer<typeof documentsSchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
export type PaymentTypeInput = z.infer<typeof paymentTypeSchema>;
export type DocumentApprovalInput = z.infer<typeof documentApprovalSchema>;
export type DocumentVerificationInput = z.infer<typeof documentVerificationSchema>;
export type SellerLoginInput = z.infer<typeof sellerLoginSchema>;

export const shopDetailsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  shopDescription: z.string().min(1, "Shop description is required"),
  gstNumber: z.string().min(15, "GST number should be 15 characters").max(15, "GST number should be 15 characters"),
  gstCertificate: z.instanceof(File).optional(),
  shopAddress: z.string().min(1, "Shop address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode should be 6 digits").max(6, "Pincode should be 6 digits"),
  shopCategory: z.string().min(1, "Shop category is required"),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
  amazonStoreUrl: z.string().url("Invalid Amazon store URL").optional().or(z.literal("")),
  shopifyStoreUrl: z.string().url("Invalid Shopify store URL").optional().or(z.literal("")),
  openCartStoreUrl: z.string().url("Invalid OpenCart store URL").optional().or(z.literal("")),
});

export type ShopDetailsInput = z.infer<typeof shopDetailsSchema>;
