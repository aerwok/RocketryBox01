import { z } from "zod";

export const emailTemplateSchema = z.object({
    emailSentFromName: z.string().min(1, "Name is required"),
    emailSentFromEmail: z.string().email("Invalid email address"),
    emailBody: z.string().min(1, "Email body is required"),
});

export const smsTemplateSchema = z.object({
    smsSentFrom: z.string().min(1, "SMS sender is required"),
    smsBody: z.string().min(1, "SMS body is required"),
});

export const emailSettingsSchema = z.object({
    emailMethod: z.enum(["php", "smtp", "sendgrid", "mailjet"]),
});

export const smsSettingsSchema = z.object({
    smsMethod: z.enum(["nexmo", "Clickatell", "Message Brid", "Infobip"]),
    apiKey: z.string().min(1, "API Key is required"),
    apiSecret: z.string().min(1, "API Secret is required"),
});

export const systemConfigSchema = z.object({
    emailNotification: z.boolean(),
    smsNotification: z.boolean(),
    languageOption: z.boolean(),
});

export type EmailTemplateValues = z.infer<typeof emailTemplateSchema>;
export type SMSTemplateValues = z.infer<typeof smsTemplateSchema>;
export type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
export type SMSSettingsValues = z.infer<typeof smsSettingsSchema>;
export type SystemConfigValues = z.infer<typeof systemConfigSchema>; 