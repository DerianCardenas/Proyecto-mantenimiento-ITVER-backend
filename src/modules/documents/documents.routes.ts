// ============================================================
// Documents Routes - Express Router
// Mounted at /api/documents in app.ts (already has authMiddleware)
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import * as documentController from './documents.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// Configure Multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// All routes under /api/documents already have authMiddleware from app.ts
// Static routes MUST be declared before dynamic routes (:ticketId, :id)
router.get('/download/:fileKey', authMiddleware, documentController.download);
router.post('/:ticketId', authMiddleware, upload.single('file'), documentController.upload);
router.get('/:ticketId', authMiddleware, documentController.listByTicket);
router.delete('/:id', authMiddleware, documentController.remove);

export default router;
