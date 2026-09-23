// ============================================================
// Buildings Controller - Express request handlers
// ============================================================

import { Request, Response } from 'express';
import * as buildingService from './buildings.service';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';

export const getAll = async (req: Request, res: Response) => {
  try {
    const buildings = await buildingService.getAll((req as any).dbClient);
    successResponse(res, buildings, 'Lista de edificios');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al listar edificios', 500);
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const building = await buildingService.getById(Number(req.params.id), (req as any).dbClient);
    if (!building) {
      return notFoundResponse(res, 'Edificio no encontrado');
    }
    successResponse(res, building, 'Edificio encontrado');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al obtener edificio', 500);
  }
};