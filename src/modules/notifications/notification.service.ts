import { NotificationModel } from './notification.model';
import { UserModel } from '../users/user.model';
import { webPush } from '@/config/third-party.config';

export class NotificationService {
  static async sendNotification(userId: string, title: string, body: string, type: 'ALERT' | 'INFO' | 'AI_ADVICE' = 'INFO') {
    // 1. Save in database (In-App notification)
    const notification = await NotificationModel.create({
      userId,
      title,
      body,
      type,
    });

    // 2. Send Web Push notification, if the user has enabled push and has a subscription
    const user = await UserModel.findById(userId);
    if (user?.notificationPreferences?.pushEnabled && user.pushSubscription) {
      try {
        await webPush.sendNotification(user.pushSubscription, JSON.stringify({ title, body }));
      } catch (error: any) {
        // 410 Gone / 404: the subscription is no longer valid, drop it so we stop retrying.
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          user.pushSubscription = undefined;
          await user.save();
        } else {
          console.error('Web Push Error:', error);
        }
      }
    }

    return notification;
  }

  static async getUserNotifications(userId: string) {
    return NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
  }

  static async markAsRead(userId: string, notificationId: string) {
    return NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }
}
