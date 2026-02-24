import { z } from "zod";

export const ExpenseCategory = z.enum([
  "Food",
  "Housing",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Other",
]);

/**
 * Create expense
 */
export const CreateExpenseSchema = z.object({
  title: z.string().min(1).max(200),
  category: ExpenseCategory,
  amount_cents: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  note: z.string().max(2000).optional(),
});

/**
 * Update expense (partial)
 */
export const UpdateExpenseSchema = CreateExpenseSchema.partial();

/**
 * List query params
 */
export const ListExpensesQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: ExpenseCategory.optional(),
  title: z.string().min(1).max(200).optional(),
  minAmount: z.coerce.number().int().min(0).optional(),
  maxAmount: z.coerce.number().int().optional(),
  sortBy: z.enum(["date", "amount", "category"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateExpenseDTO = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseDTO = z.infer<typeof UpdateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof ListExpensesQuerySchema>;
