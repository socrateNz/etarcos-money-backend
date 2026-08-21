import { AuthService } from '@/modules/auth/auth.service';
import { resendOtpSchema } from '@/modules/auth/auth.validation';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend the email verification code, if the account is unverified
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: If applicable, a new code was sent
 */
const resendOtpHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json();
  const { email } = resendOtpSchema.parse(body);

  await AuthService.resendOtp(email);

  return successResponse(null, 'Si un compte non vérifié existe avec cet email, un nouveau code a été envoyé.');
};

export const POST = withErrorHandler(resendOtpHandler);
