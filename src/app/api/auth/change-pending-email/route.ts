import { AuthService } from '@/modules/auth/auth.service';
import { changePendingEmailSchema } from '@/modules/auth/auth.validation';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';

/**
 * @swagger
 * /api/auth/change-pending-email:
 *   post:
 *     summary: Correct the email of an account that hasn't been OTP-verified yet, and send a fresh code to the new address
 *     description: >
 *       For someone stuck at the OTP screen because they mistyped/used a fake
 *       email at registration. Requires the password since there's no
 *       session yet at this point in the flow.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentEmail:
 *                 type: string
 *               password:
 *                 type: string
 *               newEmail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated, new code sent
 *       401:
 *         description: Invalid credentials
 */
const changePendingEmailHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json();
  const { currentEmail, password, newEmail } = changePendingEmailSchema.parse(body);

  const result = await AuthService.changePendingEmail(currentEmail, password, newEmail);

  return successResponse(result, 'Email mis à jour, un nouveau code a été envoyé.');
};

export const POST = withErrorHandler(changePendingEmailHandler);
