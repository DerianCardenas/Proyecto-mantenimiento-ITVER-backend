// ============================================================
// Tickets Routes - Express Router
// Mounted at /api/tickets in app.ts (already has authMiddleware)
// ============================================================

import { Router } from 'express';
import * as ticketController from './tickets.controller';

const router = Router();

// All routes under /api/tickets already have authMiddleware from app.ts
// Static routes MUST be declared before dynamic routes (:id)
router.get('/stats', ticketController.getStats);
router.get('/', ticketController.list);
router.post('/', ticketController.create);
router.get('/:id', ticketController.getById);
router.put('/:id', ticketController.update);
router.patch('/:id/status', ticketController.updateStatus);
router.delete('/:id', ticketController.remove);

export default router;
