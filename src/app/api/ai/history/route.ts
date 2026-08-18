import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { ChatHistoryModel } from '@/modules/ai/chat-history.model';

/**
 * Force recompile
 * @swagger
 * /api/ai/history:
 *   get:
 *     summary: Get AI chat history
 *     tags:
 *       - AI
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 */
const historyHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  
  const history = await ChatHistoryModel.findOne({ userId });
  
  return successResponse(history ? history.messages : []);
};

export const GET = withErrorHandler(historyHandler);
