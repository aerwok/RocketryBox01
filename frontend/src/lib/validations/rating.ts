import { z } from "zod";

export const ratingSchema = z.object({
    rating: z.number().min(1).max(10),
    remarks: z.string().max(250).optional(),
});

export type RatingFormData = z.infer<typeof ratingSchema>; 