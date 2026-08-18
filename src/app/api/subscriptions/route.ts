import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { SubscriptionService } from '@/modules/subscriptions/subscription.service';
import { createSubscriptionSchema } from '@/modules/subscriptions/subscription.validation';

/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscriptions
 *   post:
 *     summary: Create a new subscription
 *     tags:
 *       - Subscriptions
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
 *               cycle:
 *                 type: string
 *               nextPaymentDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Subscription created successfully
 */
const getSubscriptionsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const subscriptions = await SubscriptionService.getSubscriptions(userId);

  return successResponse(subscriptions);
};

const createSubscriptionHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const body = await req.json();
  const validatedData = createSubscriptionSchema.parse(body);

  const subscription = await SubscriptionService.createSubscription(userId, validatedData);
  return successResponse(subscription, 'Subscription created successfully', 201);
};

export const GET = withErrorHandler(getSubscriptionsHandler);
export const POST = withErrorHandler(createSubscriptionHandler);
