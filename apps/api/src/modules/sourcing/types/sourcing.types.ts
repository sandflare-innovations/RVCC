import { z } from "@rvcc/schemas";
import { createRequirementSchema } from "@rvcc/schemas";

export const awardableQuoteSchema = z.object({
  id: z.string(),
  newPrice: z.string(),
  vendorEmail: z.string().email(),
});
export type AwardableQuote = z.infer<typeof awardableQuoteSchema>;

/** Accept both the legacy RFQ payload and the new procurement requirement payload. */
export const createRequirementInputSchema = createRequirementSchema;
export type CreateRequirementInput = z.infer<typeof createRequirementInputSchema>;
