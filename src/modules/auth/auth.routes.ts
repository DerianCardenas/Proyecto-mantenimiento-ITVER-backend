// ============================================================
// Auth Routes - Express Router
// Mounted at /api/auth in app.ts
// register and login do NOT require authMiddleware
// /me and / DO require authMiddleware
// ============================================================

import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/authMiddleware';
import { dbContext } from '../../middleware/dbContext';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authMiddleware, requireRole('admin'), dbContext, authController.register);
router.post('/login', authController.login);
router.post('/change-password', authMiddleware, dbContext, authController.changePassword);
router.get('/me', authMiddleware, dbContext, authController.getMe);
router.get('/', authMiddleware, requireRole('admin'), dbContext, authController.listUsers);
router.put('/:id', authMiddleware, dbContext, authController.updateUser);

export default router;
