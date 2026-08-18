import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { UserModel } from '@/modules/users/user.model';
import { z } from 'zod';

const updateNotificationsSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  pushSubscription: z.any().optional(),
});

const updateNotificationsHandler = async (req: Request) => {
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
  const validatedData = updateNotificationsSchema.parse(body);

  const user = await UserModel.findById(userId);
  if (!user) {
    return errorResponse('User not found', null, 404);
  }

  // Update preferences
  if (validatedData.inAppEnabled !== undefined) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      inAppEnabled: validatedData.inAppEnabled,
    };
  }

  if (validatedData.pushEnabled !== undefined) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      pushEnabled: validatedData.pushEnabled,
    };
  }

  // Save push subscription if provided
  if (validatedData.pushSubscription !== undefined) {
    user.pushSubscription = validatedData.pushSubscription;
  }

  await user.save();

  return successResponse({
    notificationPreferences: user.notificationPreferences,
    pushSubscription: user.pushSubscription,
  }, 'Notification preferences updated successfully');
};

export const PUT = withErrorHandler(updateNotificationsHandler);
