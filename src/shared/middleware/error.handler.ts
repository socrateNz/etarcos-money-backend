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

      if (error.message === 'Invalid credentials') {
        return errorResponse('Email ou mot de passe incorrect.', error.message, 401);
      }

      if (error.message === 'Invalid or expired reset token') {
        return errorResponse('Ce lien est invalide ou a expiré.', error.message, 401);
      }

      if (error.message === 'User not found' || error.message === 'Invalid or expired refresh token') {
        return errorResponse('Unauthorized', error.message, 401);
      }

      if (error.message === 'Email already exists') {
        return errorResponse('Conflict', error.message, 409);
      }

      if (error.message === 'EMAIL_NOT_VERIFIED') {
        return errorResponse(
          "Veuillez vérifier votre adresse email. Un nouveau code vient d'être envoyé.",
          { code: 'EMAIL_NOT_VERIFIED' },
          403
        );
      }

      if (error.message === 'Invalid or expired code' || (typeof error.message === 'string' && error.message.startsWith('Too many attempts'))) {
        return errorResponse(error.message, null, 400);
      }

      if (error.message === 'ALREADY_VERIFIED') {
        return errorResponse('Ce compte est déjà vérifié, connectez-vous normalement.', null, 400);
      }

      if (error.message === 'CANNOT_DELETE_SELF') {
        return errorResponse('Vous ne pouvez pas supprimer votre propre compte depuis ce panneau.', null, 400);
      }

      if (typeof error.message === 'string' && error.message.endsWith('not found')) {
        return errorResponse('Not Found', error.message, 404);
      }

      return errorResponse('Internal Server Error', error.message || 'Something went wrong', 500);
    }
  };
};
