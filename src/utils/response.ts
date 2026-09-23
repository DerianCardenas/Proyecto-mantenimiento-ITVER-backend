// ============================================================
// Standard API response wrapper
// All responses follow the ApiResponse contract
// ============================================================

import { Request, Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export function successResponse<T>(res: Response, data: T, message?: string, status: number = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(status).json(response);
}

export function paginatedResponse<T>(res: Response, data: T[], total: number, page: number, limit: number, message?: string): Response {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    message,
  };
  return res.status(200).json(response);
}

export function errorResponse(res: Response, message: string, status: number = 400): Response {
  const response: ApiResponse<never> = {
    success: false,
    error: message,
  };
  return res.status(status).json(response);
}

export function notFoundResponse(res: Response, message: string = 'Recurso no encontrado'): Response {
  return errorResponse(res, message, 404);
}

export function createdResponse<T>(res: Response, data: T, message: string = 'Creado exitosamente'): Response {
  return successResponse(res, data, message, 201);
}
