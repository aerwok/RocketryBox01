import * as z from "zod";

export const agreementSchema = z.object({
    acceptTerms: z.boolean().refine((val) => val === true, {
        message: "You must accept the terms and conditions",
    }),
    acceptPrivacy: z.boolean().refine((val) => val === true, {
        message: "You must accept the privacy policy",
    }),
});

export type AgreementInput = z.infer<typeof agreementSchema>; 