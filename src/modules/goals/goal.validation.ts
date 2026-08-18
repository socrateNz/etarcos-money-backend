import { z } from 'zod';
import { GoalStatus } from './goal.model';

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  targetDate: z.string().or(z.date()).transform((val) => new Date(val)),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  currentAmount: z.number().min(0).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
});
