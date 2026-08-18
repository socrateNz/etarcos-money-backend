import { z } from 'zod';
import { TransactionType, TransactionStatus } from './transaction.model';

export const createTransactionSchema = z.object({
  accountId: z.string().min(1, 'Compte requis'),
  toAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.nativeEnum(TransactionType),
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.string().length(3),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  description: z.string().optional(),
  location: z.string().optional(),
  photoUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const queryTransactionSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default(1 as any),
  limit: z.string().regex(/^\d+$/).transform(Number).default(20 as any),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(), // For description and tags
});
