// ============================================================
// Tickets Routes - Express Router
// Mounted at /api/tickets in app.ts (already has authMiddleware)
// ============================================================

import { Router } from 'express';
import * as ticketController from './tickets.controller';
import { authMiddleware, requireRole } from '../../middleware/authMiddleware';

const router = Router();

// All routes under /api/tickets already have authMiddleware from app.ts
router.get('/', ticketController.list);
router.get('/:id', ticketController.getById);
router.post('/', ticketController.create);
router.put('/:id', ticketController.update);
router.patch('/:id/status', ticketController.updateStatus);
router.delete('/:id', ticketController.remove);
router.get('/stats', ticketController.getStats);

export default router;
