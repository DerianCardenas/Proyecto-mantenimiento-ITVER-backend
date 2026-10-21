import { Router } from 'express';
import { requireRole } from '../../middleware/authMiddleware';
import * as technicianController from './technicians.controller';

const router = Router();

router.get('/', technicianController.list);
router.post('/', requireRole('admin'), technicianController.create);
router.put('/:id', requireRole('admin'), technicianController.update);
router.delete('/:id', requireRole('admin'), technicianController.remove);

export default router;
