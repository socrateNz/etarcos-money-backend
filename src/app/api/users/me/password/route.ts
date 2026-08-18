import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { UserModel } from '@/modules/users/user.model';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const updatePasswordHandler = async (req: Request) => {
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
  const validatedData = updatePasswordSchema.parse(body);

  const user = await UserModel.findById(userId);
  if (!user) {
    return errorResponse('User not found', null, 404);
  }

  const isMatch = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);
  if (!isMatch) {
    return errorResponse('Incorrect current password', null, 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(validatedData.newPassword, salt);

  user.passwordHash = passwordHash;
  await user.save();

  return successResponse(null, 'Password updated successfully');
};

export const PUT = withErrorHandler(updatePasswordHandler);
