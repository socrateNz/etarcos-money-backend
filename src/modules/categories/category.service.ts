import { CategoryModel } from './category.model';
import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from './category.validation';

export class CategoryService {
  static async createCategory(userId: string, data: z.infer<typeof createCategorySchema>) {
    return CategoryModel.create({ ...data, userId });
  }

  static async getCategories(userId: string) {
    return CategoryModel.find({ userId }).sort({ name: 1 });
  }

  static async updateCategory(userId: string, categoryId: string, data: z.infer<typeof updateCategorySchema>) {
    const category = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, userId },
      { $set: data },
      { new: true }
    );
    if (!category) throw new Error('Category not found');
    return category;
  }

  static async deleteCategory(userId: string, categoryId: string) {
    const category = await CategoryModel.findOneAndDelete({ _id: categoryId, userId });
    if (!category) throw new Error('Category not found');
    return category;
  }
}
