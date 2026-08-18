import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { TransactionService } from '@/modules/transactions/transaction.service';
import { createTransactionSchema, queryTransactionSchema } from '@/modules/transactions/transaction.validation';

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags:
 *       - Transactions
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
 *         description: List of transactions
 *   post:
 *     summary: Create a new transaction
 *     tags:
 *       - Transactions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               accountId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 */
const getTransactionsHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  
  // Extract query params
  const { searchParams } = new URL(req.url);
  const rawQuery = Object.fromEntries(searchParams.entries());
  const query = queryTransactionSchema.parse(rawQuery);

  const result = await TransactionService.getTransactions(userId, query);

  return successResponse(result.data, 'Transactions fetched successfully', 200);
};

const createTransactionHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const body = await req.json();
  const validatedData = createTransactionSchema.parse(body);

  const transaction = await TransactionService.createTransaction(userId, validatedData);
  return successResponse(transaction, 'Transaction created successfully', 201);
};

export const GET = withErrorHandler(getTransactionsHandler);
export const POST = withErrorHandler(createTransactionHandler);
