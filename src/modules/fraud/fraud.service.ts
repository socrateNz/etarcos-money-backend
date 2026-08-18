import { TransactionModel } from '../transactions/transaction.model';
import mongoose from 'mongoose';

export class FraudService {
  static async analyzeTransactions(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Look for unusual transactions in the last 30 days
    // "Unusual" could mean amount > 3 * average amount for that category
    
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const expenses = await TransactionModel.find({
      userId: userObjectId,
      type: 'EXPENSE',
      date: { $gte: thirtyDaysAgo }
    }).populate('categoryId', 'name');

    if (expenses.length === 0) return { alerts: [] };

    // Calculate Average Expense
    const totalAmount = expenses.reduce((acc, t) => acc + t.amount, 0);
    const avgAmount = totalAmount / expenses.length;

    const alerts = expenses
      .filter(t => t.amount > avgAmount * 3)
      .map(t => ({
        transactionId: t._id,
        amount: t.amount,
        date: t.date,
        description: t.description,
        reason: 'Unusually high amount compared to 30-day average',
        riskScore: Math.min((t.amount / avgAmount) * 20, 100), // Max 100
      }));

    return { alerts };
  }
}
