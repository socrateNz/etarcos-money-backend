import { NextResponse } from 'next/server';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { CategoryService } from '@/modules/categories/category.service';
import { createCategorySchema } from '@/modules/categories/category.validation';

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *   post:
 *     summary: Create a new category
 *     tags:
 *       - Categories
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
const getCategoriesHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const categories = await CategoryService.getCategories(userId);

  return successResponse(categories);
};

const createCategoryHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const body = await req.json();
  const validatedData = createCategorySchema.parse(body);

  const category = await CategoryService.createCategory(userId, validatedData);
  return successResponse(category, 'Category created successfully', 201);
};

export const GET = withErrorHandler(getCategoriesHandler);
export const POST = withErrorHandler(createCategoryHandler);
