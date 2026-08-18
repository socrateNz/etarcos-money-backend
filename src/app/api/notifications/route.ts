import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { NotificationService } from '@/modules/notifications/notification.service';

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
const getNotificationsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const notifications = await NotificationService.getUserNotifications(userId);

  return successResponse(notifications);
};

export const GET = withErrorHandler(getNotificationsHandler);
