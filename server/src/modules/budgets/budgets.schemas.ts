import { z } from "zod";

export const BudgetCategory = z.enum([
  "Food",
  "Housing",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Other",
]);

export const CreateBudgetSchema = z.object({
  category: BudgetCategory,
  monthly_limit_cents: z.number().int().min(0),
  budget_month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});

export const UpdateBudgetSchema = z.object({
  monthly_limit_cents: z.number().int().min(0).optional(),
});

export const ListBudgetsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
});

export type CreateBudgetDTO = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudgetDTO = z.infer<typeof UpdateBudgetSchema>;
