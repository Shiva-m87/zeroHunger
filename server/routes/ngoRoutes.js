import { Router } from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import { getStaff, addStaff } from '../controllers/ngoController.js';

const router = Router();

router.use(protect, allowRoles('ngo'));

router.get('/staff', getStaff);
router.post('/staff', addStaff);

export default router;
