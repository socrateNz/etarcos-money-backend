import { AuthService } from '@/modules/auth/auth.service';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Format email invalide'),
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
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
 *         description: If the account exists, a reset email was sent
 */
const forgotPasswordHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json();
  const { email } = forgotPasswordSchema.parse(body);

  await AuthService.requestPasswordReset(email);

  return successResponse(null, 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.');
};

export const POST = withErrorHandler(forgotPasswordHandler);
