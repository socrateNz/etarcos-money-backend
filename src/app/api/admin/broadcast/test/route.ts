import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { requireAdmin } from '@/shared/middleware/admin.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse, errorResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { AdminService } from '@/modules/admin/admin.service';
import { broadcastSchema } from '@/modules/admin/admin.validation';
import { UserModel } from '@/modules/users/user.model';

/**
 * @swagger
 * /api/admin/broadcast/test:
 *   post:
 *     summary: Send a broadcast draft to the admin's own email only, before broadcasting to everyone (admin only)
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
 *     responses:
 *       200:
 *         description: Test email sent to the admin's own address
 */
const sendTestBroadcastHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;

  const forbidden = requireAdmin(authResult);
  if (forbidden) return forbidden;

  await connectDB();

  const adminId = authResult.headers.get('x-user-id')!;
  const admin = await UserModel.findById(adminId).select('email');
  if (!admin) {
    return errorResponse('Admin user not found', null, 404);
  }

  const body = await req.json();
  const { subject, body: content } = broadcastSchema.parse(body);

  await AdminService.sendTestBroadcast(admin.email, `[TEST] ${subject}`, content);
  return successResponse({ sentTo: admin.email }, 'Test email sent');
};

export const POST = withErrorHandler(sendTestBroadcastHandler);
