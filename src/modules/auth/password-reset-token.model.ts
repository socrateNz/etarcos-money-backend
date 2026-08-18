import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const PasswordResetTokenModel =
  mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
