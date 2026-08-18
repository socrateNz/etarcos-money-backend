import mongoose, { Schema, Document } from 'mongoose';

export enum AccountType {
  CASH = 'CASH',
  BANK = 'BANK',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CREDIT_CARD = 'CREDIT_CARD',
  SAVINGS = 'SAVINGS',
}

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(AccountType), required: true },
    currency: { type: String, required: true, default: 'XAF' },
    balance: { type: Number, required: true, default: 0 },
    color: { type: String },
    icon: { type: String },
  },
  {
    timestamps: true,
  }
);

export const AccountModel = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
