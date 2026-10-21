// ============================================================
// Auth Controller - Express request handlers
// Uses validateSync for inline DTO validation
// ============================================================

import { Request, Response } from 'express';
import { validateSync } from '../../middleware/validate';
import { RegisterUserDto, LoginUserDto, UpdateUserDto, ChangePasswordDto } from './auth.dto';
import * as authService from './auth.service';
import { successResponse, errorResponse, createdResponse } from '../../utils/response';

export const register = async (req: Request, res: Response) => {
  const result = validateSync(RegisterUserDto, req.body);
  if (!result.success) {
    const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
    return errorResponse(res, messages, 400);
  }

  try {
    const data = result.data as {
      username: string;
      email: string;
      password: string;
      fullName: string;
      role: string;
    };

    const user = await authService.registerUser(data);
    createdResponse(res, user, 'Usuario registrado exitosamente');
  } catch (err: any) {
    if (err.message?.includes('duplicate')) {
      return errorResponse(res, 'El email o nombre de usuario ya existe', 409);
    }
    errorResponse(res, err.message || 'Error al registrar usuario', 500);
  }
};

export const login = async (req: Request, res: Response) => {
  const result = validateSync(LoginUserDto, req.body);
  if (!result.success) {
    const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
    return errorResponse(res, messages, 400);
  }

  try {
    const data = result.data as { email: string; password: string };
    const { token, user } = await authService.loginUser(data.email, data.password);
    successResponse(res, { token, user }, 'Login exitoso');
  } catch (err: any) {
    errorResponse(res, err.message || 'Credenciales inválidas', 401);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string; role: string; email: string };
    const fullUser = await authService.getUserById(user.id, (req as any).dbClient);

    if (!fullUser) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    successResponse(res, fullUser, 'Datos del usuario autenticado');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al obtener datos del usuario', 500);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const result = validateSync(ChangePasswordDto, req.body);
  if (!result.success) {
    const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
    return errorResponse(res, messages, 400);
  }

  try {
    const user = req.user as { id: string };
    const data = result.data as { password: string };
    const updatedUser = await authService.changePassword(user.id, data.password, (req as any).dbClient);
    if (!updatedUser) return errorResponse(res, 'La cuenta no está disponible', 404);
    successResponse(res, updatedUser, 'Contraseña actualizada');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al actualizar la contraseña', 500);
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await authService.listUsers((req as any).dbClient);
    successResponse(res, users, 'Lista de usuarios');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al listar usuarios', 500);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const result = validateSync(UpdateUserDto, req.body);
    if (!result.success) {
      const messages = result.error?.errors.map((e) => e.message).join(', ') || 'Validación fallida';
      return errorResponse(res, messages, 400);
    }

    const data = result.data as { fullName?: string; role?: string };
    const requester = req.user as { id: string; role: string };
    const targetId = req.params.id;

    // Only admin or the user themselves can update
    if (requester.role !== 'admin' && (requester.id !== targetId || data.role !== undefined)) {
      return errorResponse(res, 'No tiene permisos para actualizar este usuario', 403);
    }

    const user = await authService.updateUser(targetId, data, (req as any).dbClient);
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    successResponse(res, user, 'Usuario actualizado exitosamente');
  } catch (err: any) {
    errorResponse(res, err.message || 'Error al actualizar usuario', 500);
  }
};
