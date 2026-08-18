import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { GoalService } from '@/modules/goals/goal.service';
import { createGoalSchema } from '@/modules/goals/goal.validation';

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Get all savings goals
 *     tags:
 *       - Goals
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of goals
 *   post:
 *     summary: Create a new savings goal
 *     tags:
 *       - Goals
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
 *               targetAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Goal created successfully
 */
const getGoalsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const goals = await GoalService.getGoals(userId);

  return successResponse(goals);
};

const createGoalHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const body = await req.json();
  const validatedData = createGoalSchema.parse(body);

  const goal = await GoalService.createGoal(userId, validatedData);
  return successResponse(goal, 'Goal created successfully', 201);
};

export const GET = withErrorHandler(getGoalsHandler);
export const POST = withErrorHandler(createGoalHandler);
