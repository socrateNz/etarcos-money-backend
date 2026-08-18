import mongoose, { Schema, Document } from 'mongoose';

export enum GoalStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  status: GoalStatus;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    targetDate: { type: Date, required: true },
    status: { type: String, enum: Object.values(GoalStatus), default: GoalStatus.IN_PROGRESS },
    color: { type: String },
    icon: { type: String },
  },
  {
    timestamps: true,
  }
);

export const GoalModel = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);
