import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { AccountService } from '@/modules/accounts/account.service';
import { createAccountSchema } from '@/modules/accounts/account.validation';

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts for user
 *     tags:
 *       - Accounts
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of accounts
 *   post:
 *     summary: Create a new account
 *     tags:
 *       - Accounts
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 */
const getAccountsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const accounts = await AccountService.getAccounts(userId);

  return successResponse(accounts);
};

const createAccountHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const body = await req.json();
  const validatedData = createAccountSchema.parse(body);

  const account = await AccountService.createAccount(userId, validatedData);
  return successResponse(account, 'Account created successfully', 201);
};

export const GET = withErrorHandler(getAccountsHandler);
export const POST = withErrorHandler(createAccountHandler);
