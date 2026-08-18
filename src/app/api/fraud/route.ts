import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { FraudService } from '@/modules/fraud/fraud.service';

/**
 * @swagger
 * /api/fraud:
 *   get:
 *     summary: Get fraud alerts and analysis
 *     tags:
 *       - Fraud
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Fraud alerts data
 */
const getFraudAlertsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const fraudData = await FraudService.analyzeTransactions(userId);

  return successResponse(fraudData);
};

export const GET = withErrorHandler(getFraudAlertsHandler);
