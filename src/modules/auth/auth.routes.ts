// ============================================================
// Auth Routes - Express Router
// Mounted at /api/auth in app.ts
// register and login do NOT require authMiddleware
// /me and / DO require authMiddleware
// ============================================================

import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/authMiddleware';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.get('/', authMiddleware, requireRole('admin'), authController.listUsers);
router.put('/:id', authMiddleware, authController.updateUser);

export default router;
