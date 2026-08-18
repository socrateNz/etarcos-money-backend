import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response.util';

export const withErrorHandler = (handler: Function) => {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      console.error('🔥 API Error:', error);

      if (error instanceof ZodError) {
        return errorResponse('Validation Error', error.format(), 400);
      }

      // Gestion des erreurs Mongoose ou autres personnalisées
      if (error.name === 'ValidationError') {
        return errorResponse('Database Validation Error', error.message, 400);
      }
      
      if (error.code === 11000) {
        return errorResponse('Duplicate Key Error', error.keyValue, 409);
      }

      if (error.message === 'Invalid credentials' || error.message === 'User not found' || error.message === 'Invalid or expired refresh token' || error.message === 'Invalid or expired reset token') {
        return errorResponse('Unauthorized', error.message, 401);
      }

      if (error.message === 'Email already exists') {
        return errorResponse('Conflict', error.message, 409);
      }

      if (typeof error.message === 'string' && error.message.endsWith('not found')) {
        return errorResponse('Not Found', error.message, 404);
      }

      return errorResponse('Internal Server Error', error.message || 'Something went wrong', 500);
    }
  };
};
