import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { SubscriptionService } from '@/modules/subscriptions/subscription.service';

/**
 * @swagger
 * /api/subscriptions/{id}/apply:
 *   post:
 *     summary: Log a transaction for this subscription's usual amount and roll it to the next billing date
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Transaction created from the subscription
 */
const applySubscriptionHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;

  const result = await SubscriptionService.applySubscription(userId, id);
  return successResponse(result, 'Transaction créée depuis l\'abonnement', 201);
};

export const POST = withErrorHandler(applySubscriptionHandler);
