import { UserModel } from '../users/user.model';
import { AccountModel } from '../accounts/account.model';
import { TransactionModel } from '../transactions/transaction.model';
import { ChatHistoryModel } from '../ai/chat-history.model';
import { SubscriptionModel } from '../subscriptions/subscription.model';
import { BudgetModel } from '../budgets/budget.model';
import { GoalModel } from '../goals/goal.model';
import { CategoryModel } from '../categories/category.model';
import { NotificationModel } from '../notifications/notification.model';
import { ReceiptModel } from '../receipts/receipt.model';
import { FinancialHealthModel } from '../financial-health/financial-health.model';
import { RefreshTokenModel } from '../auth/refresh-token.model';
import { PasswordResetTokenModel } from '../auth/password-reset-token.model';
import { EmailOtpModel } from '../auth/email-otp.model';
import { BroadcastModel, type BroadcastAudience } from './broadcast.model';
import { sendMail } from '@/shared/utils/mailer.util';
import { cloudinary } from '@/config/third-party.config';

// Only a strict `true` counts as verified — same rule as the login gate.
// Missing isEmailVerified (pre-OTP-deploy signups that never completed
// verification) counts as unverified, not verified.
const audienceFilter = (audience: BroadcastAudience) => {
  if (audience === 'verified') return { isEmailVerified: true };
  if (audience === 'unverified') return { isEmailVerified: { $ne: true } };
  return {};
};

export class AdminService {
  static async getStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      totalUsers,
      newUsers7d,
      newUsers30d,
      unverifiedUsers,
      totalAccounts,
      totalTransactions,
      totalSubscriptions,
      volumeByType,
      signupsByDay,
      totalAiConversations,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      UserModel.countDocuments({ isEmailVerified: { $ne: true } }),
      AccountModel.countDocuments(),
      TransactionModel.countDocuments(),
      SubscriptionModel.countDocuments(),
      TransactionModel.aggregate([
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      UserModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ChatHistoryModel.countDocuments(),
    ]);

    return {
      totalUsers,
      newUsers7d,
      newUsers30d,
      verifiedUsers: totalUsers - unverifiedUsers,
      unverifiedUsers,
      totalAccounts,
      totalTransactions,
      totalSubscriptions,
      totalAiConversations,
      volumeByType,
      signupsByDay,
    };
  }

  static async getUsers({ page, limit, search }: { page: number; limit: number; search?: string }) {
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter)
      .select('-passwordHash -pushSubscription')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async sendTestBroadcast(adminEmail: string, subject: string, body: string) {
    await sendMail(adminEmail, subject, body);
  }

  static async sendBroadcast(adminId: string, subject: string, body: string, audience: BroadcastAudience = 'all') {
    const users = await UserModel.find(audienceFilter(audience)).select('email');

    const results = await Promise.allSettled(users.map((u) => sendMail(u.email, subject, body)));
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    const broadcast = await BroadcastModel.create({
      subject,
      body,
      sentBy: adminId,
      audience,
      recipientCount: users.length,
      successCount,
      failureCount,
    });

    return broadcast;
  }

  static async getBroadcasts({ page, limit }: { page: number; limit: number }) {
    const total = await BroadcastModel.countDocuments();
    const data = await BroadcastModel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Permanently deletes a user and every record tied to their userId. */
  static async deleteUser(targetUserId: string, adminId: string) {
    if (targetUserId === adminId) {
      throw new Error('CANNOT_DELETE_SELF');
    }

    const user = await UserModel.findById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(user.photoPublicId);
      } catch (error) {
        console.error('Failed to delete profile photo from Cloudinary:', error);
      }
    }

    await Promise.all([
      AccountModel.deleteMany({ userId: targetUserId }),
      TransactionModel.deleteMany({ userId: targetUserId }),
      BudgetModel.deleteMany({ userId: targetUserId }),
      GoalModel.deleteMany({ userId: targetUserId }),
      CategoryModel.deleteMany({ userId: targetUserId }),
      SubscriptionModel.deleteMany({ userId: targetUserId }),
      NotificationModel.deleteMany({ userId: targetUserId }),
      ChatHistoryModel.deleteMany({ userId: targetUserId }),
      ReceiptModel.deleteMany({ userId: targetUserId }),
      FinancialHealthModel.deleteMany({ userId: targetUserId }),
      RefreshTokenModel.deleteMany({ userId: targetUserId }),
      PasswordResetTokenModel.deleteMany({ userId: targetUserId }),
      EmailOtpModel.deleteMany({ userId: targetUserId }),
    ]);

    await UserModel.findByIdAndDelete(targetUserId);

    return { deletedUserId: targetUserId, email: user.email };
  }
}
