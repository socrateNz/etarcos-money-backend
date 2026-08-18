import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { withErrorHandler } from '@/shared/middleware/error.handler';
import { successResponse } from '@/shared/utils/response.util';
import { connectDB } from '@/shared/database/mongoose';
import { ForecastService } from '@/modules/forecast/forecast.service';

/**
 * @swagger
 * /api/forecast:
 *   get:
 *     summary: Get financial forecast
 *     tags:
 *       - Forecast
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Forecast data points
 */
const getForecastHandler = async (req: Request) => {
  const authResult = await authMiddleware(req);
  if (authResult.status !== 200) return authResult;
  await connectDB();

  const userId = authResult.headers.get('x-user-id')!;
  const forecastData = await ForecastService.getForecast(userId);

  return successResponse(forecastData);
};

export const GET = withErrorHandler(getForecastHandler);
