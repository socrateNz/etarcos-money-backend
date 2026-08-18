import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { AccountService } from '@/modules/accounts/account.service';
import { updateAccountSchema } from '@/modules/accounts/account.validation';

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Update an account
 *     tags:
 *       - Accounts
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
 *         description: Account updated successfully
 *   delete:
 *     summary: Delete an account
 *     tags:
 *       - Accounts
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
 *         description: Account deleted successfully
 */
const updateAccountHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;
  const body = await req.json();
  const validatedData = updateAccountSchema.parse(body);

  const account = await AccountService.updateAccount(userId, id, validatedData);
  return successResponse(account, 'Account updated successfully');
};

const deleteAccountHandler = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;

  await AccountService.deleteAccount(userId, id);
  return successResponse(null, 'Account deleted successfully');
};

export const PUT = withErrorHandler(updateAccountHandler);
export const DELETE = withErrorHandler(deleteAccountHandler);
