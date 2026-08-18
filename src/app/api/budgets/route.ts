import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { BudgetService } from '@/modules/budgets/budget.service';
import { createBudgetSchema } from '@/modules/budgets/budget.validation';

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Get all budgets
 *     tags:
 *       - Budgets
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of budgets
 *   post:
 *     summary: Create a new budget
 *     tags:
 *       - Budgets
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
 *               amount:
 *                 type: number
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Budget created successfully
 */
const getBudgetsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const budgets = await BudgetService.getBudgets(userId);

  return successResponse(budgets);
};

const createBudgetHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const body = await req.json();
  const validatedData = createBudgetSchema.parse(body);

  const budget = await BudgetService.createBudget(userId, validatedData);
  return successResponse(budget, 'Budget created successfully', 201);
};

export const GET = withErrorHandler(getBudgetsHandler);
export const POST = withErrorHandler(createBudgetHandler);
