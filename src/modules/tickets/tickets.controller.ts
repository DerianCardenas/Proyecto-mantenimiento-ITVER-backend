// ============================================================
// Tickets Controller - Express request handlers
// Uses validateSync for inline DTO validation
// ============================================================

import { Request, Response } from 'express';
import { validateSync } from '../../middleware/validate';
import * as ticketService from './tickets.service';
import { parseSolicitudPdf } from './ticketsImport.service';
import { successResponse, errorResponse, paginatedResponse, notFoundResponse } from '../../utils/response';
import { CreateTicketDto, UpdateTicketDto, UpdateStatusDto, TicketQueryDto } from './tickets.dto';
import { TicketStatus } from '../../types';

export const list = async (req: Request, res: Response) => {
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
    }, (req as any).dbClient);

    paginatedResponse(res, tickets, total, page, limit, 'Tickets encontrados');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al listar tickets', 500);
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id, (req as any).dbClient);
    if (!ticket) {
      return notFoundResponse(res, 'Ticket no encontrado');
    }
    successResponse(res, ticket, 'Ticket encontrado');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al obtener ticket', 500);
  }
};

export const create = async (req: Request, res: Response) => {
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
      assignedTo?: string | null;
      attentionDate?: string;
      recommendations?: string;
      observations?: string;
      priority: string;
    };

    const requester = req.user as { id: string; role: string };
    const ticket = await ticketService.createTicket({
      ...data,
      createdBy: requester.id,
    }, (req as any).dbClient);

    res.status(201).json({ success: true, data: ticket, message: 'Ticket creado exitosamente' });
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al crear ticket', 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const result = validateSync(UpdateTicketDto, req.body);
    if (!result.success) {
      const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
      return errorResponse(res, messages, 400);
    }

    const data = result.data as Record<string, unknown>;
    const ticket = await ticketService.updateTicket(req.params.id, data, (req as any).dbClient);

    if (!ticket) {
      return notFoundResponse(res, 'Ticket no encontrado');
    }

    successResponse(res, ticket, 'Ticket actualizado exitosamente');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al actualizar ticket', 500);
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const result = validateSync(UpdateStatusDto, req.body);
    if (!result.success) {
      const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
      return errorResponse(res, messages, 400);
    }

    const data = result.data as { status: string };
    const ticket = await ticketService.updateStatus(req.params.id, data.status as TicketStatus, (req as any).dbClient);

    if (!ticket) {
      return notFoundResponse(res, 'Ticket no encontrado');
    }

    successResponse(res, ticket, 'Estado del ticket actualizado');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al actualizar estado', 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const deleted = await ticketService.deleteTicket(req.params.id, (req as any).dbClient);
    if (!deleted) {
      return notFoundResponse(res, 'Ticket no encontrado');
    }
    successResponse(res, { id: req.params.id }, 'Ticket eliminado exitosamente');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al eliminar ticket', 500);
  }
};

// Lee un PDF de solicitud y devuelve una sugerencia de ticket (no persiste).
// El frontend revisa/edita los campos y luego crea el ticket + adjunta el PDF.
export const importParse = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return errorResponse(res, 'Archivo PDF requerido', 400);
    }
    if (file.mimetype !== 'application/pdf') {
      return errorResponse(res, 'El archivo debe ser un PDF', 400);
    }

    const suggestion = await parseSolicitudPdf(file.buffer);
    successResponse(res, suggestion, 'PDF procesado');
  } catch (err: any) {
    errorResponse(res, err.message || 'No se pudo procesar el PDF', 500);
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await ticketService.getStats((req as any).dbClient);
    successResponse(res, stats, 'Estadísticas de tickets');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al obtener estadísticas', 500);
  }
};
