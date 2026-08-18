import { FinancialHealthModel } from './financial-health.model';
import { DashboardService } from '../dashboard/dashboard.service';
import { BudgetService } from '../budgets/budget.service';
import { AccountModel } from '../accounts/account.model';
import { TransactionModel } from '../transactions/transaction.model';
import { UserModel } from '../users/user.model';
import mongoose from 'mongoose';

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export class FinancialHealthService {
  /**
   * Heuristique simplifiée (pas un vrai moteur de credit scoring) basée
   * uniquement sur les données déjà disponibles dans l'app :
   * - savingsRatio : part du revenu du mois non dépensée
   * - debtRatio : part du solde total qui provient de comptes négatifs (découvert)
   * - budgetAdherence : à quel point les budgets actifs sont respectés
   * - consistency : sur les 3 derniers mois, part des mois où les dépenses n'ont pas dépassé les revenus
   */
  static async calculateAndSaveScore(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const dashboardData = await DashboardService.getDashboardData(userId);

    // Savings ratio
    const savingsRatio = dashboardData.incomeThisMonth > 0
      ? clamp(dashboardData.netCashFlow / dashboardData.incomeThisMonth)
      : 0;

    // Debt ratio (accounts in the negative, e.g. overdraft/credit card balance)
    const accounts = await AccountModel.find({ userId: userObjectId });
    const positiveBalance = accounts.filter(a => a.balance > 0).reduce((acc, a) => acc + a.balance, 0);
    const negativeBalance = accounts.filter(a => a.balance < 0).reduce((acc, a) => acc + Math.abs(a.balance), 0);
    const debtRatio = positiveBalance + negativeBalance > 0
      ? clamp(negativeBalance / (positiveBalance + negativeBalance))
      : 0;

    // Budget adherence
    const budgets = await BudgetService.getBudgets(userId);
    const budgetAdherence = budgets.length > 0
      ? clamp(1 - budgets.reduce((acc, b: any) => acc + Math.min(b.percentageUsed, 100), 0) / budgets.length / 100)
      : 1;

    // Consistency: share of the last 3 full months with a non-negative cash flow
    const now = new Date();
    let positiveMonths = 0;
    for (let i = 1; i <= 3; i++) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const stats = await TransactionModel.aggregate([
        { $match: { userId: userObjectId, date: { $gte: start, $lte: end }, type: { $in: ['INCOME', 'EXPENSE'] } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]);
      const income = stats.find(s => s._id === 'INCOME')?.total || 0;
      const expense = stats.find(s => s._id === 'EXPENSE')?.total || 0;
      if (income - expense >= 0) positiveMonths++;
    }
    const consistency = positiveMonths / 3;

    let score = 50;
    score += (savingsRatio - 0.5) * 40;
    score -= debtRatio * 30;
    score += (budgetAdherence - 0.5) * 30;
    score += (consistency - 0.5) * 20;
    score = Math.round(clamp(score, 0, 100));

    const health = await FinancialHealthModel.create({
      userId,
      score,
      factors: { savingsRatio, debtRatio, budgetAdherence, consistency },
    });

    await UserModel.findByIdAndUpdate(userId, { financialScore: score });

    return health;
  }

  static async getHistory(userId: string) {
    return FinancialHealthModel.find({ userId }).sort({ date: -1 }).limit(12);
  }
}
