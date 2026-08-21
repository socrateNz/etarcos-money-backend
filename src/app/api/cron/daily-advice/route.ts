import { connectDB } from '@/shared/database/mongoose';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { env } from '@/config/env.config';
import { UserModel } from '@/modules/users/user.model';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { NotificationService } from '@/modules/notifications/notification.service';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * @swagger
 * /api/cron/daily-advice:
 *   get:
 *     summary: Send every eligible user their AI daily-advice tip as a push notification
 *     description: >
 *       Triggered once a day by Vercel Cron (see vercel.json). Requires the
 *       "Authorization: Bearer $CRON_SECRET" header Vercel sends automatically
 *       when CRON_SECRET is set as a project env var.
 *     tags:
 *       - Cron
 *     responses:
 *       200:
 *         description: Summary of how many users were notified
 *       401:
 *         description: Missing/invalid cron secret
 */
const dailyAdviceHandler = async (req: Request) => {
  if (!env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return errorResponse('Unauthorized', null, 401);
  }

  await connectDB();

  const now = new Date();
  const users = await UserModel.find({
    'notificationPreferences.pushEnabled': true,
    pushSubscription: { $exists: true, $ne: null },
  }).select('_id lastAiAdviceNotifiedDate');

  const results = await Promise.allSettled(
    users.map(async (user) => {
      const userId = user._id.toString();

      if (user.lastAiAdviceNotifiedDate && isSameDay(user.lastAiAdviceNotifiedDate, now)) {
        return { userId, skipped: true };
      }

      const dashboardData = await DashboardService.getDashboardData(userId);
      const advice = await DashboardService.getAiAdvice(userId, dashboardData);
      if (!advice) return { userId, skipped: true };

      await NotificationService.sendNotification(userId, '💡 Conseil du jour', advice, 'AI_ADVICE');
      await UserModel.findByIdAndUpdate(userId, { lastAiAdviceNotifiedDate: now });

      return { userId, skipped: false };
    })
  );

  const notified = results.filter((r) => r.status === 'fulfilled' && !r.value.skipped).length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return successResponse({ totalEligible: users.length, notified, failed });
};

export const GET = withErrorHandler(dailyAdviceHandler);
