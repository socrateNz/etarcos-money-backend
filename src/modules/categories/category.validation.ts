import { z } from 'zod';
import { CategoryType } from './category.model';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Le nom de la catégorie est requis'),
  type: z.nativeEnum(CategoryType),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
