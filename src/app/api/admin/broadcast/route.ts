import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { requireAdmin } from '@/shared/middleware/admin.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { AdminService } from '@/modules/admin/admin.service';
import { broadcastSchema } from '@/modules/admin/admin.validation';

/**
 * @swagger
 * /api/admin/broadcast:
 *   get:
 *     summary: List past broadcast emails (admin only)
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
 *     responses:
 *       200:
 *         description: Paginated broadcast history
 *   post:
 *     summary: Send an email to every registered user (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               audience:
 *                 type: string
 *                 enum: [all, verified, unverified]
 *     responses:
 *       201:
 *         description: Broadcast sent, with recipient/success/failure counts
 *       403:
 *         description: Forbidden, admin role required
 */
const getBroadcastsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;

  const forbidden = requireAdmin(authResult);
  if (forbidden) return forbidden;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 10));

  const result = await AdminService.getBroadcasts({ page, limit });
  return successResponse(result);
};

const sendBroadcastHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;

  const forbidden = requireAdmin(authResult);
  if (forbidden) return forbidden;

  await connectDB();

  const adminId = authResult.headers.get('x-user-id')!;
  const body = await req.json();
  const { subject, body: content, audience } = broadcastSchema.parse(body);

  const broadcast = await AdminService.sendBroadcast(adminId, subject, content, audience);
  return successResponse(broadcast, 'Broadcast sent', 201);
};

export const GET = withErrorHandler(getBroadcastsHandler);
export const POST = withErrorHandler(sendBroadcastHandler);
