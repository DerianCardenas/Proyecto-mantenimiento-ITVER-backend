// ============================================================
// Buildings Routes - Express Router
// Mounted at /api/buildings in app.ts (no auth required)
// ============================================================

import { Router } from 'express';
import * as buildingController from './buildings.controller';

const router = Router();

router.get('/', buildingController.getAll);
router.get('/:id', buildingController.getById);

export default router;
