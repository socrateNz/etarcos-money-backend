import mongoose, { Schema, Document } from 'mongoose';

export enum BudgetPeriod {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  YEARLY = 'YEARLY',
}

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  amountLimit: number;
  period: BudgetPeriod;
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    amountLimit: { type: Number, required: true },
    period: { type: String, enum: Object.values(BudgetPeriod), default: BudgetPeriod.MONTHLY },
    notificationsEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Un utilisateur ne peut avoir qu'un seul budget actif par catégorie et par période
BudgetSchema.index({ userId: 1, categoryId: 1, period: 1 }, { unique: true });

export const BudgetModel = mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
