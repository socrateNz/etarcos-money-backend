import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { GoalService } from '@/modules/goals/goal.service';
import { updateGoalSchema } from '@/modules/goals/goal.validation';

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Update a savings goal
 *     tags:
 *       - Goals
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
 *         description: Goal updated successfully
 *   delete:
 *     summary: Delete a savings goal
 *     tags:
 *       - Goals
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
 *         description: Goal deleted successfully
 */
const updateGoalHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;
  const body = await req.json();
  const validatedData = updateGoalSchema.parse(body);

  const goal = await GoalService.updateGoal(userId, id, validatedData);
  return successResponse(goal, 'Goal updated successfully');
};

const deleteGoalHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;

  await GoalService.deleteGoal(userId, id);
  return successResponse(null, 'Goal deleted successfully');
};

export const PUT = withErrorHandler(updateGoalHandler);
export const DELETE = withErrorHandler(deleteGoalHandler);
