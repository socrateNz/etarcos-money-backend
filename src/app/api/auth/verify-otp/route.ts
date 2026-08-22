import { AuthService } from '@/modules/auth/auth.service';
import { verifyOtpSchema } from '@/modules/auth/auth.validation';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify the 6-digit code sent by email and log the user in
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
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified, logged in
 *       400:
 *         description: Invalid or expired code
 */
const verifyOtpHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json();
  const { email, otp } = verifyOtpSchema.parse(body);

  const { accessToken, refreshToken } = await AuthService.verifyOtp(email, otp);

  return successResponse({ accessToken, refreshToken }, 'Email vérifié avec succès');
};

export const POST = withErrorHandler(verifyOtpHandler);
