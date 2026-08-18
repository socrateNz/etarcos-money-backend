import mongoose, { Schema, Document } from 'mongoose';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export interface ICategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(CategoryType), required: true },
    icon: { type: String },
    color: { type: String },
  },
  {
    timestamps: true,
  }
);

// Un utilisateur ne peut pas avoir deux catégories de même nom pour le même type
CategorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
