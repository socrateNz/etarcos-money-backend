import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { ReceiptService } from '@/modules/receipts/receipt.service';

/**
 * @swagger
 * /api/receipts/upload:
 *   post:
 *     summary: Upload and process a receipt
 *     tags:
 *       - Receipts
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base64Image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Receipt processed successfully
 */
const uploadReceiptHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const body = await req.json();

  if (!body.base64Image) {
    throw new Error('base64Image is required');
  }

  // 1. Upload to Cloudinary
  const receipt = await ReceiptService.uploadReceipt(userId, body.base64Image);

  // 2. Process OCR
  const processedReceipt = await ReceiptService.processOcr(receipt._id.toString());

  return successResponse(processedReceipt, 'Receipt uploaded and processed', 201);
};

export const POST = withErrorHandler(uploadReceiptHandler);
