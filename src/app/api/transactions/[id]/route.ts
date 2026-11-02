import { NextResponse } from 'next/server';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { TransactionService } from '@/modules/transactions/transaction.service';
import { updateTransactionSchema } from '@/modules/transactions/transaction.validation';

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags:
 *       - Transactions
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
 *         description: Transaction deleted successfully
 */
const deleteTransactionHandler = async (req: Request, { params }: { params: { id: string } }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  
  // Next.js 15: params should be awaited if we follow the latest dynamic route params paradigm, 
  // but let's just use it directly or await it to be safe.
  const { id } = await params;

  await TransactionService.deleteTransaction(userId, id);

  return successResponse(null, 'Transaction deleted successfully', 200);
};

/**
 * @swagger
 * /api/transactions/{id}:
 *   patch:
 *     summary: Update a transaction
 *     tags:
 *       - Transactions
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
 *         description: Transaction updated successfully
 */
const updateTransactionHandler = async (req: Request, { params }: { params: { id: string } }) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const { id } = await params;
  const body = await req.json();
  const validatedData = updateTransactionSchema.parse(body);

  const transaction = await TransactionService.updateTransaction(userId, id, validatedData);
  return successResponse(transaction, 'Transaction updated successfully', 200);
};

export const DELETE = withErrorHandler(deleteTransactionHandler);
export const PATCH = withErrorHandler(updateTransactionHandler);
