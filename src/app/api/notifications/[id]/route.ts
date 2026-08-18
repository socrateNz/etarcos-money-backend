import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { NotificationService } from '@/modules/notifications/notification.service';

/**
 * @swagger
 * /api/notifications/{id}:
 *   patch:
 *     summary: Mark a notification as read
 *     tags:
 *       - Notifications
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
 *         description: Notification marked as read
 */
const markAsReadHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;

  const notification = await NotificationService.markAsRead(userId, id);
  if (!notification) {
    throw new Error('Notification not found');
  }

  return successResponse(notification, 'Notification marked as read');
};

export const PATCH = withErrorHandler(markAsReadHandler);
