import { Request, Response } from 'express';
import { validateSync } from '../../middleware/validate';
import { createdResponse, errorResponse, notFoundResponse, successResponse } from '../../utils/response';
import * as technicianService from './technicians.service';
import { CreateTechnicianDto, UpdateTechnicianDto } from './technicians.dto';

function validationMessage(error: any) {
  return error?.errors?.map((issue: { message: string }) => issue.message).join(', ') || 'Validación fallida';
}

function isDuplicateError(error: any) {
  return error?.code === '23505' || String(error?.message || '').toLowerCase().includes('duplicate');
}

export const list = async (req: Request, res: Response) => {
  try {
    const canSeeInactive = req.user?.role === 'admin' && req.query.includeInactive === 'true';
    const technicians = await technicianService.listTechnicians(canSeeInactive);
    successResponse(res, technicians, 'Técnicos encontrados');
  } catch (error: any) {
    errorResponse(res, error.message || 'No se pudo cargar la lista de técnicos', 500);
  }
};

export const create = async (req: Request, res: Response) => {
  const parsed = validateSync(CreateTechnicianDto, req.body);
  if (!parsed.success) return errorResponse(res, validationMessage(parsed.error), 400);

  try {
    const technician = await technicianService.createTechnician(parsed.data);
    createdResponse(res, technician, 'Técnico registrado. Deberá cambiar su contraseña al iniciar sesión.');
  } catch (error: any) {
    if (isDuplicateError(error)) return errorResponse(res, 'Ya existe una cuenta con ese correo electrónico', 409);
    errorResponse(res, error.message || 'No se pudo registrar al técnico', 500);
  }
};

export const update = async (req: Request, res: Response) => {
  const parsed = validateSync(UpdateTechnicianDto, req.body);
  if (!parsed.success) return errorResponse(res, validationMessage(parsed.error), 400);

  try {
    const technician = await technicianService.updateTechnician(req.params.id, parsed.data);
    if (!technician) return notFoundResponse(res, 'Técnico no encontrado');
    successResponse(res, technician, 'Técnico actualizado');
  } catch (error: any) {
    if (isDuplicateError(error)) return errorResponse(res, 'Ya existe una cuenta con ese correo electrónico', 409);
    errorResponse(res, error.message || 'No se pudo actualizar al técnico', 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const technician = await technicianService.deactivateTechnician(req.params.id);
    if (!technician) return notFoundResponse(res, 'Técnico no encontrado');
    successResponse(res, technician, 'Técnico desactivado');
  } catch (error: any) {
    errorResponse(res, error.message || 'No se pudo desactivar al técnico', 500);
  }
};
