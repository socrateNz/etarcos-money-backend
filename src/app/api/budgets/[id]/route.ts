import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { BudgetService } from '@/modules/budgets/budget.service';
import { updateBudgetSchema } from '@/modules/budgets/budget.validation';

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags:
 *       - Budgets
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
 *         description: Budget updated successfully
 *   delete:
 *     summary: Delete a budget
 *     tags:
 *       - Budgets
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
 *         description: Budget deleted successfully
 */
const updateBudgetHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;
  const body = await req.json();
  const validatedData = updateBudgetSchema.parse(body);

  const budget = await BudgetService.updateBudget(userId, id, validatedData);
  return successResponse(budget, 'Budget updated successfully');
};

const deleteBudgetHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;

  await BudgetService.deleteBudget(userId, id);
  return successResponse(null, 'Budget deleted successfully');
};

export const PUT = withErrorHandler(updateBudgetHandler);
export const DELETE = withErrorHandler(deleteBudgetHandler);
