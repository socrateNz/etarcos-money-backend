import { SubscriptionModel, SubscriptionFrequency } from './subscription.model';
import { TransactionService } from '../transactions/transaction.service';
import { TransactionType } from '../transactions/transaction.model';
import { z } from 'zod';
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscription.validation';

const advanceDate = (date: Date, frequency: SubscriptionFrequency): Date => {
  const next = new Date(date);
  switch (frequency) {
    case SubscriptionFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case SubscriptionFrequency.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
    case SubscriptionFrequency.MONTHLY:
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
};

export class SubscriptionService {
  static async createSubscription(userId: string, data: z.infer<typeof createSubscriptionSchema>) {
    return SubscriptionModel.create({ ...data, userId });
  }

  static async getSubscriptions(userId: string) {
    return SubscriptionModel.find({ userId })
      .sort({ nextBillingDate: 1 })
      .populate('accountId', 'name currency')
      .populate('categoryId', 'name icon color');
  }

  static async updateSubscription(userId: string, subscriptionId: string, data: z.infer<typeof updateSubscriptionSchema>) {
    const subscription = await SubscriptionModel.findOneAndUpdate(
      { _id: subscriptionId, userId },
      { $set: data },
      { new: true }
    );
    if (!subscription) throw new Error('Subscription not found');
    return subscription;
  }

  static async deleteSubscription(userId: string, subscriptionId: string) {
    const subscription = await SubscriptionModel.findOneAndDelete({ _id: subscriptionId, userId });
    if (!subscription) throw new Error('Subscription not found');
    return subscription;
  }

  /**
   * One-click "pay this bill": logs a transaction for the subscription's usual
   * amount/account/category, then rolls nextBillingDate forward one cycle so
   * the button is ready for next time without re-entering anything.
   */
  static async applySubscription(userId: string, subscriptionId: string) {
    const subscription = await SubscriptionModel.findOne({ _id: subscriptionId, userId });
    if (!subscription) throw new Error('Subscription not found');

    const transaction = await TransactionService.createTransaction(userId, {
      accountId: subscription.accountId.toString(),
      categoryId: subscription.categoryId?.toString(),
      type: TransactionType.EXPENSE,
      amount: subscription.amount,
      currency: subscription.currency,
      date: new Date(),
      description: subscription.name,
      isRecurring: true,
    } as any);

    subscription.nextBillingDate = advanceDate(subscription.nextBillingDate, subscription.frequency);
    await subscription.save();

    return { subscription, transaction };
  }
}
