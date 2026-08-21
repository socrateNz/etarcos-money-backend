import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel, type IUser } from '../users/user.model';
import { RefreshTokenModel } from './refresh-token.model';
import { PasswordResetTokenModel } from './password-reset-token.model';
import { EmailOtpModel } from './email-otp.model';
import { CategoryModel, CategoryType } from '../categories/category.model';
import { env } from '@/config/env.config';
import { sendMail } from '@/shared/utils/mailer.util';
import { z } from 'zod';
import { registerSchema, loginSchema } from './auth.validation';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

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
      isEmailVerified: false,
    });

    await CategoryModel.insertMany(
      DEFAULT_CATEGORIES.map((cat) => ({ ...cat, userId: user._id }))
    );

    await this.sendOtp(user);

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      requiresVerification: true,
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

    // Accounts created before OTP verification existed have no
    // isEmailVerified field at all (undefined) — only a strict `false` (set
    // on new registrations) blocks login here.
    if (user.isEmailVerified === false) {
      await this.sendOtp(user);
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    return this.generateTokens(user._id.toString(), user.role);
  }

  /** Generates, stores (hashed), and emails a fresh 6-digit OTP for a user. */
  static async sendOtp(user: IUser) {
    const otp = generateOtp();
    await EmailOtpModel.create({
      userId: user._id,
      otpHash: hashToken(otp),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      await sendMail(
        user.email,
        'Votre code de vérification Tacynt Money',
        `Bonjour ${user.firstName || ''},\n\nVotre code de vérification est : ${otp}\n\nCe code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`
      );
    } catch (error) {
      // Don't fail registration/login over a transient mail-provider hiccup —
      // the code is saved, "resend code" is the recovery path.
      console.error('Failed to send OTP email:', error);
    }
  }

  static async resendOtp(email: string) {
    const user = await UserModel.findOne({ email });
    // Same "resolve silently" reasoning as password reset: don't let this
    // endpoint confirm whether an email is registered.
    if (!user || user.isEmailVerified !== false) return;

    await this.sendOtp(user);
  }

  static async verifyOtp(email: string, otp: string) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('Invalid or expired code');
    }

    // Already verified (e.g. they resubmit after a slow network response):
    // just log them in instead of erroring.
    if (user.isEmailVerified !== false) {
      return this.generateTokens(user._id.toString(), user.role);
    }

    const record = await EmailOtpModel.findOne({ userId: user._id, used: false }).sort({ createdAt: -1 });
    if (!record || record.expiresAt < new Date()) {
      throw new Error('Invalid or expired code');
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new Error('Too many attempts. Request a new code.');
    }

    if (record.otpHash !== hashToken(otp)) {
      record.attempts += 1;
      await record.save();
      throw new Error('Invalid or expired code');
    }

    record.used = true;
    await record.save();
    user.isEmailVerified = true;
    await user.save();

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
    try {
      await sendMail(
        user.email,
        'Réinitialisation de votre mot de passe Tacynt Money',
        `Bonjour ${user.firstName || ''},\n\nCliquez sur ce lien pour réinitialiser votre mot de passe (valide 1 heure) :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`
      );
    } catch (error) {
      // Don't let a transient mail-provider hiccup turn into a 500 for the
      // user, and don't leak whether the send failed — same "always resolve
      // silently" reasoning as the "user not found" branch above. The token
      // is already saved, so a retry (or the console/SMTP logs) can recover.
      console.error('Failed to send password reset email:', error);
    }
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
