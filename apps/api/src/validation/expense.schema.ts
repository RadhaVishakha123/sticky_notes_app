import { z } from 'zod';

const expenseCategorySchema = z.string().min(1, 'Category is required').max(50);

export const createExpenseSchema = z.object({
  title:    z.string().min(1, 'Title is required').max(200),
  amount:   z.number().positive('Amount must be positive'),
  category: expenseCategorySchema,
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  noteId:   z.string().nullable().optional(),
  source:   z.enum(['manual', 'note']).default('manual'),
});

export const updateExpenseSchema = z.object({
  title:    z.string().min(1).max(200).optional(),
  amount:   z.number().positive().optional(),
  category: expenseCategorySchema.optional(),
  date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const expenseIdSchema = z.object({
  id: z.string().cuid('Invalid expense ID'),
});

export const setBudgetSchema = z.object({
  month:  z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
  amount: z.number().min(0, 'Budget must be 0 or more'),
});

export const getBudgetQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
});

export const updateExpenseSettingsSchema = z.object({
  summaryEnabled:        z.boolean().optional(),
  summaryTime:           z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').optional(),
  budget80AlertEnabled:  z.boolean().optional(),
  budget100AlertEnabled: z.boolean().optional(),
});

export type CreateExpenseInput         = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput         = z.infer<typeof updateExpenseSchema>;
export type SetBudgetInput             = z.infer<typeof setBudgetSchema>;
export type GetBudgetQueryInput        = z.infer<typeof getBudgetQuerySchema>;
export type UpdateExpenseSettingsInput = z.infer<typeof updateExpenseSettingsSchema>;
