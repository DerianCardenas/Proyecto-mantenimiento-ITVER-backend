// ============================================================
// Buildings Controller - Express request handlers
// ============================================================

import { Request, Response } from 'express';
import * as buildingService from './buildings.service';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const buildings = await buildingService.getAll();
    successResponse(res, buildings, 'Lista de edificios');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al listar edificios', 500);
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const building = await buildingService.getById(Number(req.params.id));
    if (!building) {
      return notFoundResponse(res, 'Edificio no encontrado');
    }
    successResponse(res, building, 'Edificio encontrado');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al obtener edificio', 500);
  }
};
