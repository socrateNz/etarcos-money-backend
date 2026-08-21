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
import { generateStatementPdf } from '@/modules/reports/statement-pdf.util';

/**
 * @swagger
 * /api/users/me/export:
 *   get:
 *     summary: Export the current user's data
 *     description: >
 *       Defaults to a full JSON snapshot of the account. Pass format=pdf for a
 *       transactions statement PDF, optionally scoped with startDate/endDate
 *       (ISO date strings) to filter by day, week, month, or a custom period.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: A JSON bundle, or a PDF statement, of the user's data
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

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') === 'pdf' ? 'pdf' : 'json';
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const startDate = startDateParam ? new Date(startDateParam) : undefined;
  const endDate = endDateParam ? new Date(endDateParam) : undefined;

  const transactionFilter: Record<string, unknown> = { userId };
  if (startDate || endDate) {
    transactionFilter.date = {
      ...(startDate ? { $gte: startDate } : {}),
      ...(endDate ? { $lte: endDate } : {}),
    };
  }

  if (format === 'pdf') {
    const [user, transactions] = await Promise.all([
      UserModel.findById(userId).select('firstName lastName email currency'),
      TransactionModel.find(transactionFilter)
        .sort({ date: -1 })
        .populate('categoryId', 'name')
        .populate('accountId', 'name'),
    ]);

    if (!user) {
      return errorResponse('User not found', null, 404);
    }

    const pdfBuffer = await generateStatementPdf({
      user,
      startDate,
      endDate,
      transactions: transactions as any,
      defaultCurrency: user.currency,
    });

    const filename = `tacynt-money-releve-${new Date().toISOString().split('T')[0]}.pdf`;
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  const [user, accounts, transactions, budgets, goals, subscriptions, categories] = await Promise.all([
    UserModel.findById(userId).select('-passwordHash -pushSubscription'),
    AccountModel.find({ userId }),
    TransactionModel.find(transactionFilter).populate('categoryId', 'name').populate('accountId', 'name'),
    BudgetModel.find({ userId }).populate('categoryId', 'name'),
    GoalModel.find({ userId }),
    SubscriptionModel.find({ userId }),
    CategoryModel.find({ userId }),
  ]);

  return successResponse({
    exportedAt: new Date(),
    period: startDate || endDate ? { startDate, endDate } : null,
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
