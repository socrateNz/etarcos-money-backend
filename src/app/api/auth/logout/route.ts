import { AuthService } from '@/modules/auth/auth.service';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { z } from 'zod';

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revokes the given refresh token, if any, so it can no longer be used to stay signed in.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
const logoutHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const { refreshToken } = logoutSchema.parse(body);

  if (refreshToken) {
    await AuthService.logout(refreshToken);
  }

  return successResponse(null, 'Logged out successfully');
};

export const POST = withErrorHandler(logoutHandler);
