import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  toAccountId?: mongoose.Types.ObjectId; // For transfers
  categoryId?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: string;
  date: Date;
  description?: string;
  location?: string;
  photoUrl?: string;
  ocrData?: any; // Storing arbitrary OCR JSON extraction
  tags: string[];
  isRecurring: boolean;
  status: TransactionStatus;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    description: { type: String, trim: true },
    location: { type: String },
    photoUrl: { type: String },
    ocrData: { type: Schema.Types.Mixed },
    tags: [{ type: String, trim: true }],
    isRecurring: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.COMPLETED },
    source: { type: String },
  },
  {
    timestamps: true,
  }
);

export const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
