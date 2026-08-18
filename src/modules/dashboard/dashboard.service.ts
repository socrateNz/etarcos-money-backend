import { AccountModel } from '../accounts/account.model';
import { TransactionModel } from '../transactions/transaction.model';
import { UserModel } from '../users/user.model';
import { google } from '@/config/third-party.config';
import { generateText } from 'ai';
import mongoose from 'mongoose';

const CHART_DAYS = 14;
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export class DashboardService {
  /**
   * Reconstructs a "last N days" balance curve by walking the current total
   * balance backwards using each day's net INCOME/EXPENSE (transfers between
   * own accounts net out to zero and are excluded).
   */
  static async getBalanceHistory(userId: string, totalBalance: number) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const since = new Date();
    since.setDate(since.getDate() - (CHART_DAYS - 1));
    since.setHours(0, 0, 0, 0);

    const dailyNet = await TransactionModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: { $in: ['INCOME', 'EXPENSE'] },
          date: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          net: {
            $sum: { $cond: [{ $eq: ['$type', 'INCOME'] }, '$amount', { $multiply: ['$amount', -1] }] },
          },
        },
      },
    ]);

    const netByDay = new Map(dailyNet.map((d) => [d._id, d.net]));

    // Build the day list, then walk backwards from today's known total balance.
    const days: { key: string; label: string; net: number }[] = [];
    for (let i = 0; i < CHART_DAYS; i++) {
      const date = new Date(since);
      date.setDate(since.getDate() + i);
      const key = date.toISOString().split('T')[0];
      days.push({ key, label: DAY_LABELS[date.getDay()], net: netByDay.get(key) || 0 });
    }

    const totalNetInWindow = days.reduce((acc, d) => acc + d.net, 0);
    let runningBalance = totalBalance - totalNetInWindow;

    return days.map((d) => {
      runningBalance += d.net;
      return { day: d.label, balance: Math.round(runningBalance * 100) / 100 };
    });
  }

  static async getAiAdvice(userId: string, context: { totalBalance: number; incomeThisMonth: number; expenseThisMonth: number; netCashFlow: number }) {
    const user = await UserModel.findById(userId);
    if (!user) return undefined;

    const isFresh = user.lastAiAdviceDate && Date.now() - user.lastAiAdviceDate.getTime() < 24 * 60 * 60 * 1000;
    if (isFresh && user.lastAiAdviceText) {
      return user.lastAiAdviceText;
    }

    try {
      const { text } = await generateText({
        model: google('gemini-3.5-flash'),
        system: 'Tu es un conseiller financier. Donne UN SEUL conseil court (1-2 phrases max), concret et actionnable, en français, sans salutation ni formule de politesse.',
        prompt: `Solde total: ${context.totalBalance}. Revenus ce mois: ${context.incomeThisMonth}. Dépenses ce mois: ${context.expenseThisMonth}. Flux net: ${context.netCashFlow}.`,
      });

      user.lastAiAdviceText = text;
      user.lastAiAdviceDate = new Date();
      await user.save();

      return text;
    } catch (error) {
      console.error('AI Advice Error:', error);
      return user.lastAiAdviceText; // fall back to the previous cached advice, if any
    }
  }

  static async getDashboardData(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Total Balance from Accounts
    const accounts = await AccountModel.find({ userId: userObjectId });
    const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

    // 2. Current Month Income & Expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyStats = await TransactionModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: { $in: ['INCOME', 'EXPENSE'] }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const incomeThisMonth = monthlyStats.find(s => s._id === 'INCOME')?.total || 0;
    const expenseThisMonth = monthlyStats.find(s => s._id === 'EXPENSE')?.total || 0;

    // 3. Recent Transactions (last 5)
    const recentTransactions = await TransactionModel.find({ userId: userObjectId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .populate('categoryId', 'name icon color')
      .populate('accountId', 'name type');

    // 4. Expenses by Category (Current Month) for Pie Chart
    const expensesByCategory = await TransactionModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: 'EXPENSE'
        }
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: '$category.name',
          color: '$category.color',
          total: 1
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    return {
      totalBalance,
      incomeThisMonth,
      expenseThisMonth,
      netCashFlow: incomeThisMonth - expenseThisMonth,
      recentTransactions,
      expensesByCategory,
    };
  }

  /**
   * Full payload for the dashboard screen: core stats plus the chart/AI-advice
   * enrichment. Kept separate from getDashboardData() so other services
   * (AI chat, financial health, forecast) that only need the core numbers
   * don't pay for an extra aggregate query + a Gemini call on every use.
   */
  static async getFullDashboardData(userId: string) {
    const core = await this.getDashboardData(userId);

    const [chartData, aiAdvice] = await Promise.all([
      this.getBalanceHistory(userId, core.totalBalance),
      this.getAiAdvice(userId, core),
    ]);

    return { ...core, chartData, aiAdvice };
  }
}
