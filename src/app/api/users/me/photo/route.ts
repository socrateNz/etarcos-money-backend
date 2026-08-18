import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { UserModel } from '@/modules/users/user.model';
import { cloudinary } from '@/config/third-party.config';
import { z } from 'zod';

const updatePhotoSchema = z.object({
  base64Image: z.string().min(1, 'base64Image is required'),
});

/**
 * @swagger
 * /api/users/me/photo:
 *   put:
 *     summary: Update the current user's profile photo
 *     description: Uploads the new photo to Cloudinary and deletes the previous one, if any.
 *     tags:
 *       - Users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base64Image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile photo updated successfully
 */
const updatePhotoHandler = async (req: Request) => {
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
  const { base64Image } = updatePhotoSchema.parse(body);

  const user = await UserModel.findById(userId);
  if (!user) {
    return errorResponse('User not found', null, 404);
  }

  const uploadResponse = await cloudinary.uploader.upload(base64Image, {
    folder: `tacynt-money/avatars/${userId}`,
    // Square avatar, centered on the face when one is detected.
    transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
  });

  const previousPublicId = user.photoPublicId;

  user.photo = uploadResponse.secure_url;
  user.photoPublicId = uploadResponse.public_id;
  await user.save();

  if (previousPublicId) {
    try {
      await cloudinary.uploader.destroy(previousPublicId);
    } catch (error) {
      // Non-fatal: the new photo is already saved, an orphaned old asset is not worth failing the request over.
      console.error('Failed to delete previous profile photo from Cloudinary:', error);
    }
  }

  const { passwordHash, ...safeUser } = user.toObject();
  return successResponse(safeUser, 'Profile photo updated successfully');
};

export const PUT = withErrorHandler(updatePhotoHandler);
