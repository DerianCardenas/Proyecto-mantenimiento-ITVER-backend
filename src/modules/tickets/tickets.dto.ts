// ============================================================
// Tickets DTOs - Zod validation schemas
// All API/JSON properties follow camelCase convention
// ============================================================

import { z } from 'zod';

export const TicketStatusEnum = z.enum(['pending', 'in_progress', 'resolved', 'closed', 'cancelled']);
export const TicketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const CreateTicketDto = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  buildingId: z.number().optional(),
  buildingName: z.string().optional(),
  technicianName: z.string().optional(),
  attentionDate: z.string().datetime().optional(),
  recommendations: z.string().optional(),
  observations: z.string().optional(),
  priority: TicketPriorityEnum.default('medium'),
});

export const UpdateTicketDto = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  buildingId: z.number().optional(),
  buildingName: z.string().optional(),
  technicianName: z.string().optional(),
  attentionDate: z.string().datetime().optional(),
  recommendations: z.string().optional(),
  observations: z.string().optional(),
  priority: TicketPriorityEnum.optional(),
});

export const UpdateStatusDto = z.object({
  status: TicketStatusEnum,
});

export const TicketQueryDto = z.object({
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
  buildingName: z.string().optional(),
  technicianName: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(10),
  sort: z.string().optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketDto>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketDto>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusDto>;
export type TicketQueryInput = z.infer<typeof TicketQueryDto>;
