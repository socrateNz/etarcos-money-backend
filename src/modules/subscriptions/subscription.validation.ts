import { z } from 'zod';
import { SubscriptionFrequency } from './subscription.model';

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional(),
  frequency: z.nativeEnum(SubscriptionFrequency).optional(),
  nextBillingDate: z.string().or(z.date()).transform((val) => new Date(val)),
  autoDetected: z.boolean().optional(),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();
