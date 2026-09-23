// ============================================================
// Tickets Controller - Express request handlers
// Uses validateSync for inline DTO validation
// ============================================================

import { Request, Response } from 'express';
import { validateSync } from '../../middleware/validate';
import * as ticketService from './tickets.service';
import { successResponse, errorResponse, paginatedResponse, notFoundResponse } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler';
import { CreateTicketDto, UpdateTicketDto, UpdateStatusDto, TicketQueryDto } from './tickets.dto';
import { Ticket } from '../../types';

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = validateSync(TicketQueryDto, req.query);
    if (!result.success) {
      const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
      return errorResponse(res, messages, 400);
    }

    const data = result.data as {
      status?: string;
      priority?: string;
      buildingName?: string;
      technicianName?: string;
      page?: number;
      limit?: number;
      sort?: string;
    };

    const { data: tickets, total, page, limit } = await ticketService.getTickets({
      status: data.status as any,
      priority: data.priority as any,
      buildingName: data.buildingName,
      technicianName: data.technicianName,
      page: data.page,
      limit: data.limit,
      sort: data.sort || 'created_at DESC',
    });

    paginatedResponse(res, tickets, total, page, limit, 'Tickets encontrados');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al listar tickets', 500);
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    if (!ticket) {
      return notFoundResponse(res, 'Ticket no encontrado');
    }
    successResponse(res, ticket, 'Ticket encontrado');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al obtener ticket', 500);
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = validateSync(CreateTicketDto, req.body);
    if (!result.success) {
      const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
      return errorResponse(res, messages, 400);
    }

    const data = result.data as {
      title: string;
      description: string;
      buildingId?: number;
      buildingName?: string;
      technicianName?: string;
      attentionDate?: string;
      recommendations?: string;
      observations?: string;
      priority: string;
    };

    const requester = req.user as { id: string; role: string };
    const ticket = await ticketService.createTicket({
      ...data,
      createdBy: requester.id,
    });

    res.status(201).json({ success: true, data: ticket, message: 'Ticket creado exitosamente' });
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al crear ticket', 500);
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = validateSync(UpdateTicketDto, req.body);
    if (!result.success) {
      const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
      return errorResponse(res, messages, 400);
    }

    const data = result.data as Record<string, unknown>;
    const ticket = await ticketService.updateTicket(req.params.id, data);

    if (!ticket) {
      return notFoundResponse(res, 'Ticket no encontrado');
    }

    successResponse(res, ticket, 'Ticket actualizado exitosamente');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al actualizar ticket', 500);
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = validateSync(UpdateStatusDto, req.body);
    if (!result.success) {
      const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
      return errorResponse(res, messages, 400);
    }

    const data = result.data as { status: string };
    const ticket = await ticketService.updateStatus(req.params.id, data.status);

    if (!ticket) {
      return notFoundResponse(res, 'Ticket no encontrado');
    }

    successResponse(res, ticket, 'Estado del ticket actualizado');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al actualizar estado', 500);
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await ticketService.deleteTicket(req.params.id);
    if (!deleted) {
      return notFoundResponse(res, 'Ticket no encontrado');
    }
    successResponse(res, { id: req.params.id }, 'Ticket eliminado exitosamente');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al eliminar ticket', 500);
  }
};

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const requester = req.user as { role: string };
    const stats = await ticketService.getStats();
    successResponse(res, stats, 'Estadísticas de tickets');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al obtener estadísticas', 500);
  }
};
