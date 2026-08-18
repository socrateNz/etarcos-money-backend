import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  currency: string;
  country?: string;
  language: string;
  photo?: string;
  role: UserRole;
  financialScore: number;
  aiPreferences: {
    notificationsEnabled: boolean;
    tone: 'professional' | 'friendly' | 'strict';
  };
  notificationPreferences: {
    inAppEnabled: boolean;
    pushEnabled: boolean;
  };
  pushSubscription?: any; // To store Web Push subscription object
  lastAiAdviceText?: string;
  lastAiAdviceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    currency: { type: String, required: true, default: 'XAF' },
    country: { type: String, trim: true },
    language: { type: String, required: true, default: 'en' },
    photo: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    financialScore: { type: Number, default: 50 },
    aiPreferences: {
      notificationsEnabled: { type: Boolean, default: true },
      tone: { type: String, enum: ['professional', 'friendly', 'strict'], default: 'friendly' },
    },
    notificationPreferences: {
      inAppEnabled: { type: Boolean, default: true },
      pushEnabled: { type: Boolean, default: false },
    },
    pushSubscription: { type: Schema.Types.Mixed },
    lastAiAdviceText: { type: String },
    lastAiAdviceDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
