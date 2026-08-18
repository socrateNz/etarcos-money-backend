import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { UserModel } from '@/modules/users/user.model';
import { AccountModel } from '@/modules/accounts/account.model';
import { TransactionModel } from '@/modules/transactions/transaction.model';
import { BudgetModel } from '@/modules/budgets/budget.model';
import { GoalModel } from '@/modules/goals/goal.model';
import { SubscriptionModel } from '@/modules/subscriptions/subscription.model';
import { CategoryModel } from '@/modules/categories/category.model';

/**
 * @swagger
 * /api/users/me/export:
 *   get:
 *     summary: Export all of the current user's data as JSON
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A JSON bundle of the user's data
 */
const exportDataHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200 && authResult.headers.get('content-type')?.includes('application/json')) {
    return authResult;
  }

  await connectDB();
  const userId = authResult.headers.get('x-user-id');
  if (!userId) {
    return errorResponse('User ID missing from context', null, 401);
  }

  const [user, accounts, transactions, budgets, goals, subscriptions, categories] = await Promise.all([
    UserModel.findById(userId).select('-passwordHash -pushSubscription'),
    AccountModel.find({ userId }),
    TransactionModel.find({ userId }).populate('categoryId', 'name').populate('accountId', 'name'),
    BudgetModel.find({ userId }).populate('categoryId', 'name'),
    GoalModel.find({ userId }),
    SubscriptionModel.find({ userId }),
    CategoryModel.find({ userId }),
  ]);

  return successResponse({
    exportedAt: new Date(),
    profile: user,
    accounts,
    transactions,
    budgets,
    goals,
    subscriptions,
    categories,
  });
};

export const GET = withErrorHandler(exportDataHandler);
