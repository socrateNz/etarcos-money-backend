import { SubscriptionModel } from './subscription.model';
import { z } from 'zod';
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscription.validation';

export class SubscriptionService {
  static async createSubscription(userId: string, data: z.infer<typeof createSubscriptionSchema>) {
    return SubscriptionModel.create({ ...data, userId });
  }

  static async getSubscriptions(userId: string) {
    return SubscriptionModel.find({ userId }).sort({ nextBillingDate: 1 });
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
}
