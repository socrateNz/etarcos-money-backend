import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../users/user.model';
import { RefreshTokenModel } from './refresh-token.model';
import { PasswordResetTokenModel } from './password-reset-token.model';
import { CategoryModel, CategoryType } from '../categories/category.model';
import { env } from '@/config/env.config';
import { sendMail } from '@/shared/utils/mailer.util';
import { z } from 'zod';
import { registerSchema, loginSchema } from './auth.validation';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const DEFAULT_CATEGORIES: { name: string; type: CategoryType; icon: string; color: string }[] = [
  { name: 'Alimentation', type: CategoryType.EXPENSE, icon: 'Coffee', color: '#f97316' },
  { name: 'Transport', type: CategoryType.EXPENSE, icon: 'Car', color: '#3b82f6' },
  { name: 'Logement', type: CategoryType.EXPENSE, icon: 'Home', color: '#8b5cf6' },
  { name: 'Loisirs', type: CategoryType.EXPENSE, icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Santé', type: CategoryType.EXPENSE, icon: 'HeartPulse', color: '#ef4444' },
  { name: 'Autre', type: CategoryType.EXPENSE, icon: 'CircleDollarSign', color: '#64748b' },
  { name: 'Salaire', type: CategoryType.INCOME, icon: 'Wallet', color: '#10b981' },
];

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>) {
    const existingUser = await UserModel.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await UserModel.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      currency: data.currency || 'XAF',
    });

    await CategoryModel.insertMany(
      DEFAULT_CATEGORIES.map((cat) => ({ ...cat, userId: user._id }))
    );

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  static async login(data: z.infer<typeof loginSchema>) {
    const user = await UserModel.findOne({ email: data.email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user._id.toString(), user.role);
  }

  static async generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshTokenModel.create({
      userId,
      token: refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  static async refresh(token: string) {
    const storedToken = await RefreshTokenModel.findOne({ token });
    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Revoke the old token (Rotation)
    storedToken.revoked = true;
    await storedToken.save();

    const user = await UserModel.findById(storedToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user._id.toString(), user.role);
  }

  static async logout(token: string) {
    await RefreshTokenModel.findOneAndUpdate({ token }, { revoked: true });
  }

  static async requestPasswordReset(email: string) {
    const user = await UserModel.findOne({ email });
    // Always resolve silently, whether or not the account exists, so this
    // endpoint can't be used to enumerate registered emails.
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    await PasswordResetTokenModel.create({
      userId: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendMail(
      user.email,
      'Réinitialisation de votre mot de passe Tacynt Money',
      `Bonjour ${user.firstName || ''},\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valide 1 heure) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`
    );
  }

  static async resetPassword(rawToken: string, newPassword: string) {
    const resetToken = await PasswordResetTokenModel.findOne({ tokenHash: hashToken(rawToken) });
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await UserModel.findByIdAndUpdate(resetToken.userId, { passwordHash });

    resetToken.used = true;
    await resetToken.save();

    // Revoke all existing sessions for safety.
    await RefreshTokenModel.updateMany({ userId: resetToken.userId, revoked: false }, { revoked: true });
  }
}
