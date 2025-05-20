import { z } from "zod";

export const policySchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    content: z.string().min(1, "Content is required"),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
    isPublished: z.boolean().default(true),
    requiredForSignup: z.boolean().default(false),
    template: z.enum(["default", "custom"]).default("default"),
    version: z.string().optional(),
    lastUpdated: z.string().optional(),
});

export type PolicyValues = z.infer<typeof policySchema>; 