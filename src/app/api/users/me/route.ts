import { NextResponse } from 'next/server';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { UserModel } from '@/modules/users/user.model';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
});
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 */
const meHandler = async (req: Request) => {
  // 1. Run the auth middleware
  const authResult = await authMiddleware(req);
  
  // If authMiddleware returned a response (meaning it failed/error), return it
  if (authResult.status !== 200 && authResult.headers.get('content-type')?.includes('application/json')) {
    return authResult;
  }

  // 2. Connect DB
  await connectDB();

  // 3. Extract user ID from the modified headers
  // Next.js NextResponse.next() modified request is accessible through the authResult if it succeeded,
  // but since we return NextResponse.next({ request: { headers } }), we should read headers from authResult.
  // Actually, in App Router route handlers, middleware is usually applied via `middleware.ts` globally.
  // Since we are calling it as a function here, let's extract the header from `authResult`.
  const userId = authResult.headers.get('x-user-id');

  if (!userId) {
    return errorResponse('User ID missing from context', null, 401);
  }

  const user = await UserModel.findById(userId).select('-passwordHash');
  if (!user) {
    return errorResponse('User not found', null, 404);
  }

  return successResponse(user, 'User profile fetched successfully');
};

export const GET = withErrorHandler(meHandler);

const updateProfileHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200 && authResult.headers.get('content-type')?.includes('application/json')) {
    return authResult;
  }

  await connectDB();
  const userId = authResult.headers.get('x-user-id');
  if (!userId) {
    return errorResponse('User ID missing from context', null, 401);
  }

  const body = await req.json();
  const validatedData = updateProfileSchema.parse(body);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: validatedData },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!updatedUser) {
    return errorResponse('User not found', null, 404);
  }

  return successResponse(updatedUser, 'User profile updated successfully');
};

export const PUT = withErrorHandler(updateProfileHandler);
