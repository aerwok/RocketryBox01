import * as z from "zod";

export const profileFormSchema = z.object({
    username: z
        .string()
        .min(2, "Username must be at least 2 characters")
        .max(30, "Username must not be longer than 30 characters")
        .optional(),
    email: z
        .string()
        .email("Invalid email address")
        .optional(),
    bio: z
        .string()
        .max(160, "Bio must not be longer than 160 characters")
        .optional(),
}).refine((data) => {
    // Ensure at least one field is provided
    return Object.values(data).some(value => value !== undefined);
}, {
    message: "At least one profile field must be changed",
});

export const accountFormSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must not be longer than 50 characters")
        .optional(),
    dateOfBirth: z.date().optional(),
    language: z
        .string()
        .min(1, "Language is required")
        .optional(),
}).refine((data) => {
    // Ensure at least one field is provided
    return Object.values(data).some(value => value !== undefined);
}, {
    message: "At least one account setting must be changed",
});

export const appearanceFormSchema = z.object({
    theme: z.enum(["light", "dark"]).optional(),
    fontSize: z.enum(["small", "medium", "large"]).optional(),
}).refine((data) => {
    // Ensure at least one field is provided
    return data.theme !== undefined || data.fontSize !== undefined;
}, {
    message: "At least one appearance setting must be changed",
});

export const notificationFormSchema = z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
}).refine((data) => {
    // Ensure at least one field is provided
    return Object.values(data).some(value => value !== undefined);
}, {
    message: "At least one notification setting must be changed",
});

export const displayFormSchema = z.object({
    dateFormat: z
        .string()
        .min(1, "Date format is required")
        .optional(),
    timeFormat: z
        .string()
        .min(1, "Time format is required")
        .optional(),
    timezone: z
        .string()
        .min(1, "Timezone is required")
        .optional(),
    weekStart: z
        .string()
        .min(1, "Week start is required")
        .optional(),
    showSeconds: z
        .boolean()
        .optional(),
}).refine((data) => {
    // Ensure at least one field is provided
    return Object.values(data).some(value => value !== undefined);
}, {
    message: "At least one display setting must be changed",
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type AccountFormValues = z.infer<typeof accountFormSchema>;
export type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;
export type NotificationFormValues = z.infer<typeof notificationFormSchema>;
export type DisplayFormValues = z.infer<typeof displayFormSchema>;
