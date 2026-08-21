import mongoose, { Schema, Document } from 'mongoose';

export interface IBroadcast extends Document {
  subject: string;
  body: string;
  sentBy: mongoose.Types.ObjectId;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastSchema: Schema = new Schema(
  {
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientCount: { type: Number, required: true, default: 0 },
    successCount: { type: Number, required: true, default: 0 },
    failureCount: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const BroadcastModel = mongoose.models.Broadcast || mongoose.model<IBroadcast>('Broadcast', BroadcastSchema);
