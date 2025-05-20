import { z } from "zod";

export const systemSettingsSchema = z.object({
    // General Settings
    siteTitle: z.string().min(1, "Site title is required"),
    siteUrl: z.string().url("Invalid URL format"),
    adminEmail: z.string().email("Invalid email format"),
    supportPhone: z.string().min(1, "Support phone is required"),
    
    // Display Settings
    timezone: z.string().min(1, "Timezone is required"),
    dateFormat: z.string().min(1, "Date format is required"),
    timeFormat: z.string().min(1, "Time format is required"),
    weekStart: z.string().min(1, "Week start is required"),
    showSeconds: z.boolean(),
    
    // Currency Settings
    currency: z.string().min(1, "Currency is required"),
    currencySymbol: z.string().min(1, "Currency symbol is required"),
    currencyFormat: z.string().min(1, "Currency format is required"),
    
    // Payment Settings
    enabledGateways: z.array(z.string()),
    defaultGateway: z.string().min(1, "Default gateway is required"),
    autoRefundEnabled: z.boolean(),
    refundPeriod: z.number().min(1, "Refund period must be at least 1 day"),
    
    // Shipping Settings
    defaultCouriers: z.array(z.string()),
    enabledCouriers: z.array(z.string()),
    autoAssignCourier: z.boolean(),
    defaultWeightUnit: z.string().min(1, "Default weight unit is required"),
    defaultDimensionUnit: z.string().min(1, "Default dimension unit is required"),
    
    // Security Settings
    sessionTimeout: z.number().min(1, "Session timeout must be at least 1 minute"),
    loginAttempts: z.number().min(1, "Login attempts must be at least 1"),
    passwordResetExpiry: z.number().min(1, "Password reset expiry must be at least 1 hour"),
    twoFactorAuth: z.boolean(),
});

export type SystemSettingsValues = z.infer<typeof systemSettingsSchema>; 