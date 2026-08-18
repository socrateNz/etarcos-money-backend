import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').optional(),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  currency: z.string().length(3, 'La devise doit contenir 3 caractères (ex: XAF)').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});
