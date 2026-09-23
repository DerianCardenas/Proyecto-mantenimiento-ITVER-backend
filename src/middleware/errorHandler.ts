// ============================================================
// Global error handler middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[ERROR]', err.stack);

  if (err.message.includes('ECONNREFUSED')) {
    return res.status(503).json({ success: false, error: 'Servicio de base de datos no disponible' });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  });
}

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}
