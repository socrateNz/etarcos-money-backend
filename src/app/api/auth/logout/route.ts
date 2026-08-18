import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthService } from '@/modules/auth/auth.service';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clears refresh token cookie and invalidates session
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
const logoutHandler = async (req: Request) => {
  await connectDB();
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (refreshToken) {
    await AuthService.logout(refreshToken);
    cookieStore.delete('refresh_token');
  }

  return successResponse(null, 'Logged out successfully');
};

export const POST = withErrorHandler(logoutHandler);
