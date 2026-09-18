import { z } from 'zod';

export const createExpenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().nonnegative(),
  categoryId: z.number().int().positive().optional(),
  spentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'spentAt must be in YYYY-MM-DD format'),
  notes: z.string().max(2000).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.coerce.number().int().positive().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
