import mongoose, { Schema, Document } from 'mongoose';

export enum ReceiptStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

export interface IReceipt extends Document {
  userId: mongoose.Types.ObjectId;
  transactionId?: mongoose.Types.ObjectId;
  cloudinaryUrl: string;
  ocrData?: {
    store?: string;
    date?: string;
    amount?: number;
    vat?: number;
    products?: { name: string; price: number; category?: string }[];
  };
  status: ReceiptStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    cloudinaryUrl: { type: String, required: true },
    ocrData: {
      store: { type: String },
      date: { type: String },
      amount: { type: Number },
      vat: { type: Number },
      products: [
        {
          name: { type: String },
          price: { type: Number },
          category: { type: String },
        },
      ],
    },
    status: { type: String, enum: Object.values(ReceiptStatus), default: ReceiptStatus.PENDING },
  },
  {
    timestamps: true,
  }
);

export const ReceiptModel = mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);
