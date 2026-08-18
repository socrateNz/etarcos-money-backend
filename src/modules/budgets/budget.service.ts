import { BudgetModel } from './budget.model';
import { TransactionModel } from '../transactions/transaction.model';
import { z } from 'zod';
import { createBudgetSchema, updateBudgetSchema } from './budget.validation';
import mongoose from 'mongoose';

export class BudgetService {
  static async createBudget(userId: string, data: z.infer<typeof createBudgetSchema>) {
    return BudgetModel.create({ ...data, userId });
  }

  static async getBudgets(userId: string) {
    // We want to return the budgets along with their current progress (spent amount)
    const budgets = await BudgetModel.find({ userId }).populate('categoryId', 'name icon color').lean();
    
    // Calculate progress for each budget
    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = this.getStartDateForPeriod(budget.period);
        
        const result = await TransactionModel.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              categoryId: new mongoose.Types.ObjectId(budget.categoryId as unknown as string),
              type: 'EXPENSE',
              date: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' },
            },
          },
        ]);

        const spent = result.length > 0 ? result[0].totalSpent : 0;
        return {
          ...budget,
          spent,
          remaining: budget.amountLimit - spent,
          percentageUsed: Math.min((spent / budget.amountLimit) * 100, 100),
        };
      })
    );

    return budgetsWithProgress;
  }

  static async updateBudget(userId: string, budgetId: string, data: z.infer<typeof updateBudgetSchema>) {
    const budget = await BudgetModel.findOneAndUpdate(
      { _id: budgetId, userId },
      { $set: data },
      { new: true }
    );
    if (!budget) throw new Error('Budget not found');
    return budget;
  }

  static async deleteBudget(userId: string, budgetId: string) {
    const budget = await BudgetModel.findOneAndDelete({ _id: budgetId, userId });
    if (!budget) throw new Error('Budget not found');
    return budget;
  }

  private static getStartDateForPeriod(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'WEEKLY':
        // Start of current week (Monday)
        const day = now.getDay() || 7;
        now.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - day + 1);
        return now;
      case 'YEARLY':
        return new Date(now.getFullYear(), 0, 1);
      case 'MONTHLY':
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
}
