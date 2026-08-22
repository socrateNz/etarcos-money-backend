import { AuthService } from '@/modules/auth/auth.service';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { z } from 'zod';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Exchanges a still-valid refresh token for a new access/refresh token pair (rotation).
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Unauthorized
 */
const refreshHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const parsed = refreshSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse('No refresh token provided', null, 401);
  }

  const { accessToken, refreshToken } = await AuthService.refresh(parsed.data.refreshToken);

  return successResponse({ accessToken, refreshToken }, 'Token refreshed successfully');
};

export const POST = withErrorHandler(refreshHandler);
