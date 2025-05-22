import * as z from "zod";

const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const customerRegisterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    mobile: z.string().min(10, "Mobile number must be 10 digits").max(10),
    mobileOtp: z.string().length(6, "Mobile OTP must be 6 digits"),
    email: z.string().email("Please enter a valid email address"),
    emailOtp: z.string().length(6, "Email OTP must be 6 digits"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    address1: z.string().min(1, "Address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(6, "Pincode must be 6 digits").max(6),
    acceptTerms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const customerLoginSchema = z.object({
    phoneOrEmail: z.string()
        .min(1, "Phone number or email is required")
        .refine((value) => {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            const isPhone = /^[0-9]{10}$/.test(value);
            return isEmail || isPhone;
        }, {
            message: "Please enter a valid phone number (10 digits) or email address",
        }),
    password: z.string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters"),
    otp: z.string()
        .length(6, "OTP must be 6 digits")
        .optional(),
    rememberMe: z.boolean()
        .default(false),
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>; 