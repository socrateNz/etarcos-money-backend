import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { ReportService } from '@/modules/reports/report.service';

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Generate monthly report
 *     tags:
 *       - Reports
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Report data
 */
const generateReportHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  
  // Dans un cas réel, cette route pourrait renvoyer directement un fichier PDF (application/pdf)
  // ou un lien vers S3/Cloudinary.
  const reportData = await ReportService.generateMonthlyReport(userId);

  return successResponse(reportData);
};

export const GET = withErrorHandler(generateReportHandler);
