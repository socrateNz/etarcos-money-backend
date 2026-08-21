import { errorResponse } from '../utils/response.util';

/**
 * Call after authMiddleware succeeds. Returns an error Response if the
 * authenticated user isn't an admin, or null if they're clear to proceed.
 */
export const requireAdmin = (authResult: Response) => {
  const role = authResult.headers.get('x-user-role');
  if (role !== 'ADMIN') {
    return errorResponse('Forbidden: admin access required', null, 403);
  }
  return null;
};
