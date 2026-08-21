import { UserModel } from '../users/user.model';
import { AccountModel } from '../accounts/account.model';
import { TransactionModel } from '../transactions/transaction.model';
import { ChatHistoryModel } from '../ai/chat-history.model';
import { SubscriptionModel } from '../subscriptions/subscription.model';

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
}
