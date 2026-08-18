import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.util';
import { env } from '@/config/env.config';

export const authMiddleware = async (req: Request) => {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('Unauthorized: Missing or invalid token', null, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; role: string };

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', decoded.role);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    // Add them to response headers so route handlers can read them easily
    response.headers.set('x-user-id', decoded.userId);
    response.headers.set('x-user-role', decoded.role);

    return response;
  } catch (error) {
    return errorResponse('Unauthorized: Invalid or expired token', null, 401);
  }
};
