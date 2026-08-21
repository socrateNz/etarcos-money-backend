import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { requireAdmin } from '@/shared/middleware/admin.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { AdminService } from '@/modules/admin/admin.service';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Search and list all users (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       403:
 *         description: Forbidden, admin role required
 */
const getUsersHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;

  const forbidden = requireAdmin(authResult);
  if (forbidden) return forbidden;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
  const search = searchParams.get('search') || undefined;

  const result = await AdminService.getUsers({ page, limit, search });
  return successResponse(result);
};

export const GET = withErrorHandler(getUsersHandler);
