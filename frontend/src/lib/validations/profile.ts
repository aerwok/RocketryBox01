import { z } from "zod";

export const formSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Phone number must be 10 digits").max(10),
    profileImage: z.any().optional(),
});

export type ProfileFormValues = z.infer<typeof formSchema>;
