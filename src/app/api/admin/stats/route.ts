import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { requireAdmin } from '@/shared/middleware/admin.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { AdminService } from '@/modules/admin/admin.service';

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Platform-wide KPIs (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Platform stats
 *       403:
 *         description: Forbidden, admin role required
 */
const getStatsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;

  const forbidden = requireAdmin(authResult);
  if (forbidden) return forbidden;

  await connectDB();
  const stats = await AdminService.getStats();
  return successResponse(stats);
};

export const GET = withErrorHandler(getStatsHandler);
