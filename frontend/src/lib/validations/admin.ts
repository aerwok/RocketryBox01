import * as z from "zod";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const adminRegisterSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["Admin", "Manager", "Support", "Agent"], {
        required_error: "Please select a role",
    }),
    department: z.string().min(1, "Department is required"),
    phoneNumber: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number must not exceed 15 digits"),
    address: z.string().min(1, "Address is required"),
    dateOfJoining: z.string().min(1, "Date of joining is required"),
    employeeId: z.string().optional(),
    isSuperAdmin: z.boolean().default(false),
    remarks: z.string().optional(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
        ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    profileImage: z
        .any()
        .refine((file) => !file || file?.size <= MAX_FILE_SIZE, "Max file size is 5MB.")
        .refine(
            (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type),
            "Only .jpg, .jpeg, .png and .webp formats are supported."
        )
        .optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;

export const teamMemberRegisterSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["Admin", "Manager", "Support", "Agent"], {
        required_error: "Please select a role",
    }),
    department: z.string().min(1, "Department is required"),
    phoneNumber: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number must not exceed 15 digits"),
    address: z.string().optional(),
    dateOfJoining: z.string().optional(),
    designation: z.string().optional(),
    remarks: z.string().optional(),
    sendInvitation: z.boolean().default(true),
});

export type TeamMemberRegisterInput = z.infer<typeof teamMemberRegisterSchema>;

export const adminLoginSchema = z.object({
    email: z.string()
        .min(1, "Email or mobile number is required"),
    password: z.string()
        .min(1, "Password is required"),
    rememberMe: z.boolean().default(false)
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>; 