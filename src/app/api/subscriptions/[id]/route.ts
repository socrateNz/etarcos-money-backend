import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { SubscriptionService } from '@/modules/subscriptions/subscription.service';
import { updateSubscriptionSchema } from '@/modules/subscriptions/subscription.validation';

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   put:
 *     summary: Update a subscription
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
 *       200:
 *         description: Subscription updated successfully
 *   delete:
 *     summary: Delete a subscription
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
 *       200:
 *         description: Subscription deleted successfully
 */
const updateSubscriptionHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;
  const body = await req.json();
  const validatedData = updateSubscriptionSchema.parse(body);

  const subscription = await SubscriptionService.updateSubscription(userId, id, validatedData);
  return successResponse(subscription, 'Subscription updated successfully');
};

const deleteSubscriptionHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;

  await SubscriptionService.deleteSubscription(userId, id);
  return successResponse(null, 'Subscription deleted successfully');
};

export const PUT = withErrorHandler(updateSubscriptionHandler);
export const DELETE = withErrorHandler(deleteSubscriptionHandler);
