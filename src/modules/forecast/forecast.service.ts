import { TransactionModel } from '../transactions/transaction.model';
import mongoose from 'mongoose';

export class ForecastService {
  static async getForecast(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Simplistic forecasting: Average of last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const stats = await TransactionModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: threeMonthsAgo },
        }
      },
      {
        $group: {
          _id: { type: '$type', month: { $month: '$date' }, year: { $year: '$date' } },
          total: { $sum: '$amount' }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let monthsCount = new Set();

    stats.forEach(stat => {
      monthsCount.add(`${stat._id.year}-${stat._id.month}`);
      if (stat._id.type === 'INCOME') totalIncome += stat.total;
      if (stat._id.type === 'EXPENSE') totalExpense += stat.total;
    });

    const divisor = monthsCount.size || 1;
    const avgIncome = totalIncome / divisor;
    const avgExpense = totalExpense / divisor;

    return {
      forecast: {
        nextMonthPredictedIncome: avgIncome,
        nextMonthPredictedExpense: avgExpense,
        predictedSavings: avgIncome - avgExpense,
      }
    };
  }
}
