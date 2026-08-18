import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { CategoryService } from '@/modules/categories/category.service';
import { updateCategorySchema } from '@/modules/categories/category.validation';

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *   delete:
 *     summary: Delete a category
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
const updateCategoryHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;
  const body = await req.json();
  const validatedData = updateCategorySchema.parse(body);

  const category = await CategoryService.updateCategory(userId, id, validatedData);
  return successResponse(category, 'Category updated successfully');
};

const deleteCategoryHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;

  await CategoryService.deleteCategory(userId, id);
  return successResponse(null, 'Category deleted successfully');
};

export const PUT = withErrorHandler(updateCategoryHandler);
export const DELETE = withErrorHandler(deleteCategoryHandler);
