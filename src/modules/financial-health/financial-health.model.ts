import mongoose, { Schema, Document } from 'mongoose';

export interface IFinancialHealth extends Document {
  userId: mongoose.Types.ObjectId;
  score: number;
  date: Date;
  factors: {
    savingsRatio: number;
    debtRatio: number;
    budgetAdherence: number;
    consistency: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FinancialHealthSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    date: { type: Date, required: true, default: Date.now },
    factors: {
      savingsRatio: { type: Number },
      debtRatio: { type: Number },
      budgetAdherence: { type: Number },
      consistency: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

export const FinancialHealthModel = mongoose.models.FinancialHealth || mongoose.model<IFinancialHealth>('FinancialHealth', FinancialHealthSchema);
