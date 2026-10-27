// ============================================================
// Tickets Routes - Express Router
// Mounted at /api/tickets in app.ts (already has authMiddleware)
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import * as ticketController from './tickets.controller';
import { requireRole } from '../../middleware/authMiddleware';

const router = Router();

// Multer en memoria para la importación de PDF (límite 10 MB como los adjuntos)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All routes under /api/tickets already have authMiddleware from app.ts
// Static routes MUST be declared before dynamic routes (:id)
router.get('/stats', ticketController.getStats);
router.post('/import/parse', requireRole('admin'), upload.single('file'), ticketController.importParse);
router.get('/', ticketController.list);
router.post('/', ticketController.create);
router.get('/:id', ticketController.getById);
router.put('/:id', ticketController.update);
router.patch('/:id/status', ticketController.updateStatus);
router.delete('/:id', ticketController.remove);

export default router;
