import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { AiService } from '@/modules/ai/ai.service';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with AI assistant
 *     tags:
 *       - AI
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI Response
 */
const chatHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const body = await req.json();
  const { message } = chatSchema.parse(body);

  const response = await AiService.chat(userId, message);

  return successResponse(response);
};

export const POST = withErrorHandler(chatHandler);
