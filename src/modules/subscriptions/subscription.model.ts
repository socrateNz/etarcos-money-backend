import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionFrequency {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  nextBillingDate: Date;
  autoDetected: boolean;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'XAF' },
    frequency: { type: String, enum: Object.values(SubscriptionFrequency), default: SubscriptionFrequency.MONTHLY },
    nextBillingDate: { type: Date, required: true },
    autoDetected: { type: Boolean, default: false },
    category: { type: String },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionModel = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
