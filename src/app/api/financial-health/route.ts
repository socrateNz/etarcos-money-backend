import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { FinancialHealthService } from '@/modules/financial-health/financial-health.service';

/**
 * @swagger
 * /api/financial-health:
 *   get:
 *     summary: Get financial health score
 *     tags:
 *       - Financial Health
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current score and history
 */
const getHealthHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  
  // Update score on demand for this endpoint
  await FinancialHealthService.calculateAndSaveScore(userId);
  
  const history = await FinancialHealthService.getHistory(userId);
  const currentScore = history.length > 0 ? history[0] : null;

  return successResponse({ currentScore, history });
};

export const GET = withErrorHandler(getHealthHandler);
