import { AuthService } from '@/modules/auth/auth.service';
import { loginSchema } from '@/modules/auth/auth.validation';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Login with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Logged in successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
const loginHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json();
  const validatedData = loginSchema.parse(body);

  const { accessToken, refreshToken } = await AuthService.login(validatedData);

  return successResponse({ accessToken, refreshToken }, 'Logged in successfully');
};

export const POST = withErrorHandler(loginHandler);
