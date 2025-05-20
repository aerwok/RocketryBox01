import { z } from "zod";

export const maintenanceSchema = z.object({
    isEnabled: z.boolean(),
    image: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    scheduledStart: z.string().optional(),
    scheduledEnd: z.string().optional(),
    whitelistedIPs: z.array(z.string()).optional(),
    customCSS: z.string().optional(),
    customJS: z.string().optional(),
    analyticsEnabled: z.boolean().default(false),
});

export type MaintenanceValues = z.infer<typeof maintenanceSchema>; 