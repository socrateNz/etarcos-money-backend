import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '@/modules/auth/auth.service';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { env } from '@/config/env.config';

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Uses refresh token cookie to get a new access token
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Unauthorized
 */
const refreshHandler = async (req: Request) => {
  await connectDB();
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!refreshToken) {
    return errorResponse('No refresh token provided', null, 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(refreshToken);

  cookieStore.set('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/api/auth',
  });

  return successResponse({ accessToken }, 'Token refreshed successfully');
};

export const POST = withErrorHandler(refreshHandler);
