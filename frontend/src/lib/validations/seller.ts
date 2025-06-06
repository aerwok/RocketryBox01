import * as z from "zod";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const sellerLoginSchema = z.object({
  emailOrPhone: z.string()
    .min(1, "Email or phone number is required")
    .refine((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10}$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    }, {
      message: "Please enter a valid email address or phone number (10 digits)",
    }),
  password: z.string().optional(),
  otp: z.string().optional(),
  newPassword: passwordSchema.optional(),
  confirmPassword: passwordSchema.optional(),
  rememberMe: z.boolean().default(false),
}).refine((data) => {
  // Only validate password match if both new password fields are present
  if (data.newPassword && data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const sellerRegisterSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string()
    .min(10, "Phone number must be 10 digits")
    .max(10)
    .regex(/^[6-9]\d{9}$/, "Please provide a valid Indian phone number"),
  email: z.string().email("Please enter a valid email address"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  monthlyShipments: z.string().min(1, "Please select monthly shipments"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
    ),
  confirmPassword: z.string()
    .min(8, "Password must be at least 8 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const sellerCompanySchema = z.object({
  category: z.string().min(1, "Please select a category"),
  gstNumber: z.string().min(15, "GST number must be 15 characters").max(15),
  panNumber: z.string().min(10, "PAN number must be 10 characters").max(10),
  aadhaarNumber: z.string().min(12, "Aadhaar number must be 12 digits").max(12),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
  gstDocument: z.custom<File>((val) => val instanceof File, {
    message: "GST document is required"
  }).refine((file) => file instanceof File && file.size <= 5 * 1024 * 1024, {
    message: "GST document must be less than 5MB"
  }).optional(),
  panDocument: z.custom<File>((val) => val instanceof File, {
    message: "PAN document is required"
  }).refine((file) => file instanceof File && file.size <= 5 * 1024 * 1024, {
    message: "PAN document must be less than 5MB"
  }).optional(),
  aadhaarDocument: z.custom<File>((val) => val instanceof File, {
    message: "Aadhaar document is required"
  }).refine((file) => file instanceof File && file.size <= 5 * 1024 * 1024, {
    message: "Aadhaar document must be less than 5MB"
  }).optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export const sellerBankSchema = z.object({
  accountType: z.string().min(1, "Please select account type"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  branchName: z.string().min(1, "Branch name is required"),
  ifscCode: z.string().min(11, "IFSC code must be 11 characters").max(11),
  cancelledChequeDocument: z.instanceof(File, { message: "Cancelled cheque document is required" }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type SellerLoginInput = z.infer<typeof sellerLoginSchema>;
export type SellerRegisterInput = z.infer<typeof sellerRegisterSchema>;
export type SellerCompanyInput = z.infer<typeof sellerCompanySchema>;
export type SellerBankInput = z.infer<typeof sellerBankSchema>;
