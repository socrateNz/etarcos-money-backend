import { TransactionModel } from './transaction.model';
import { AccountModel } from '../accounts/account.model';
import { z } from 'zod';
import { createTransactionSchema, updateTransactionSchema, queryTransactionSchema } from './transaction.validation';

export class TransactionService {
  static async createTransaction(userId: string, data: z.infer<typeof createTransactionSchema>) {
    const session = await TransactionModel.startSession();
    session.startTransaction();
    try {
      // Create Transaction
      const transaction = await TransactionModel.create([{ ...data, userId }], { session });

      // Update Account Balance
      const amountChange = data.type === 'INCOME' ? data.amount : -data.amount;
      
      if (data.type === 'TRANSFER' && data.toAccountId) {
        // Source account loses money
        await AccountModel.findByIdAndUpdate(data.accountId, { $inc: { balance: -data.amount } }, { session });
        // Target account gains money
        await AccountModel.findByIdAndUpdate(data.toAccountId, { $inc: { balance: data.amount } }, { session });
      } else {
        await AccountModel.findByIdAndUpdate(data.accountId, { $inc: { balance: amountChange } }, { session });
      }

      await session.commitTransaction();
      session.endSession();
      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async getTransactions(userId: string, query: z.infer<typeof queryTransactionSchema>) {
    const filter: any = { userId };

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }
    if (query.type) filter.type = query.type;
    if (query.accountId) filter.accountId = query.accountId;
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.search) {
      filter.$or = [
        { description: { $regex: query.search, $options: 'i' } },
        { tags: { $regex: query.search, $options: 'i' } },
      ];
    }

    const total = await TransactionModel.countDocuments(filter);
    const transactions = await TransactionModel.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('categoryId', 'name icon color')
      .populate('accountId', 'name type');

    return {
      data: transactions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  static async deleteTransaction(userId: string, transactionId: string) {
    const transaction = await TransactionModel.findOne({ _id: transactionId, userId });
    if (!transaction) throw new Error('Transaction not found');

    const session = await TransactionModel.startSession();
    session.startTransaction();
    try {
      // Reverse balance
      const amountChange = transaction.type === 'INCOME' ? -transaction.amount : transaction.amount;

      if (transaction.type === 'TRANSFER' && transaction.toAccountId) {
        await AccountModel.findByIdAndUpdate(transaction.accountId, { $inc: { balance: transaction.amount } }, { session });
        await AccountModel.findByIdAndUpdate(transaction.toAccountId, { $inc: { balance: -transaction.amount } }, { session });
      } else {
        await AccountModel.findByIdAndUpdate(transaction.accountId, { $inc: { balance: amountChange } }, { session });
      }

      await TransactionModel.findByIdAndDelete(transactionId).session(session);

      await session.commitTransaction();
      session.endSession();
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
