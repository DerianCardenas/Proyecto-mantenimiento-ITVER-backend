// ============================================================
// JWT Authentication Middleware
// Verifies token from Authorization header
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/auth';
import { AppError } from './errorHandler';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Token de autenticación requerido'));
  }

  const token = authHeader.split('Bearer ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return next(new AppError(401, 'Token inválido o expirado'));
  }

  (req as any).user = decoded;
  next();
}

// Role-based access control
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!roles.includes(user.role)) {
      return next(new AppError(403, 'No tiene permisos para realizar esta acción'));
    }
    next();
  };
}
