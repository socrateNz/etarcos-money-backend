import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { requireAdmin } from '@/shared/middleware/admin.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { AdminService } from '@/modules/admin/admin.service';

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Permanently delete a user and all of their data (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Cannot delete your own account this way
 *       403:
 *         description: Forbidden, admin role required
 */
const deleteUserHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;

  const forbidden = requireAdmin(authResult);
  if (forbidden) return forbidden;

  await connectDB();

  const adminId = authResult.headers.get('x-user-id')!;
  const { id } = await params;

  const result = await AdminService.deleteUser(id, adminId);
  return successResponse(result, 'Utilisateur supprimé');
};

export const DELETE = withErrorHandler(deleteUserHandler);
