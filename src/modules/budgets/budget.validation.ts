import { z } from 'zod';
import { BudgetPeriod } from './budget.model';

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  amountLimit: z.number().positive('Budget limit must be positive'),
  period: z.nativeEnum(BudgetPeriod).optional(),
  notificationsEnabled: z.boolean().optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();
