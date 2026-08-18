import { AccountModel } from './account.model';
import { z } from 'zod';
import { createAccountSchema, updateAccountSchema } from './account.validation';

export class AccountService {
  static async createAccount(userId: string, data: z.infer<typeof createAccountSchema>) {
    return AccountModel.create({ ...data, userId });
  }

  static async getAccounts(userId: string) {
    return AccountModel.find({ userId }).sort({ createdAt: -1 });
  }

  static async updateAccount(userId: string, accountId: string, data: z.infer<typeof updateAccountSchema>) {
    const account = await AccountModel.findOneAndUpdate(
      { _id: accountId, userId },
      { $set: data },
      { new: true }
    );
    if (!account) throw new Error('Account not found');
    return account;
  }

  static async deleteAccount(userId: string, accountId: string) {
    const account = await AccountModel.findOneAndDelete({ _id: accountId, userId });
    if (!account) throw new Error('Account not found');
    return account;
  }
}
