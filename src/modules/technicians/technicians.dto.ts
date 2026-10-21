import { z } from 'zod';

export const CreateTechnicianDto = z.object({
  fullName: z.string().trim().min(2, 'Ingresa el nombre completo').max(150),
  email: z.string().trim().email('Ingresa un correo válido').max(100),
  password: z.string().min(8, 'La contraseña inicial debe tener al menos 8 caracteres').max(128),
});

export const UpdateTechnicianDto = z.object({
  fullName: z.string().trim().min(2).max(150).optional(),
  email: z.string().trim().email('Ingresa un correo válido').max(100).optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, 'Indica al menos un dato para actualizar');

export type CreateTechnicianInput = z.infer<typeof CreateTechnicianDto>;
export type UpdateTechnicianInput = z.infer<typeof UpdateTechnicianDto>;
