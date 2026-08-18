import { z } from 'zod';
import { AccountType } from './account.model';

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.nativeEnum(AccountType),
  currency: z.string().length(3).optional(),
  balance: z.number().default(0),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateAccountSchema = createAccountSchema.partial();
