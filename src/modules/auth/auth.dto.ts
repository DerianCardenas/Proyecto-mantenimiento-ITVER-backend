// ============================================================
// Auth DTOs - Zod validation schemas
// All API/JSON properties follow camelCase convention
// ============================================================

import { z } from 'zod';

export const RegisterUserDto = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(1, 'El nombre completo es obligatorio'),
  role: z.enum(['admin', 'technician', 'receptionist'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
});

export const LoginUserDto = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const LoginResponseDto = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    role: z.string(),
    fullName: z.string(),
    isActive: z.boolean(),
    createdAt: z.string(),
  }),
});

export const UpdateUserDto = z.object({
  fullName: z.string().optional().min(1),
  role: z.enum(['admin', 'technician', 'receptionist']).optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserDto>;
export type LoginUserInput = z.infer<typeof LoginUserDto>;
export type LoginResponse = z.infer<typeof LoginResponseDto>;
export type UpdateUserInput = z.infer<typeof UpdateUserDto>;
