import { AuthService } from '@/modules/auth/auth.service';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset the password using a token received by email
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Invalid or expired token
 */
const resetPasswordHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json();
  const { token, newPassword } = resetPasswordSchema.parse(body);

  await AuthService.resetPassword(token, newPassword);

  return successResponse(null, 'Mot de passe réinitialisé avec succès');
};

export const POST = withErrorHandler(resetPasswordHandler);
