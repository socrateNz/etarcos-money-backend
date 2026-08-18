import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: 'ALERT' | 'INFO' | 'AI_ADVICE';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['ALERT', 'INFO', 'AI_ADVICE'], default: 'INFO' },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
