import { NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/auth.service';
import { registerSchema } from '@/modules/auth/auth.validation';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
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
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user exists
 */
const registerHandler = async (req: Request) => {
  await connectDB();
  const body = await req.json();
  const validatedData = registerSchema.parse(body);

  const user = await AuthService.register(validatedData);

  return successResponse(user, 'User registered successfully', 201);
};

export const POST = withErrorHandler(registerHandler);
