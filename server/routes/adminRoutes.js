import { Router } from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import { getNgos, setNgoVerification, getStats } from '../controllers/adminController.js';

const router = Router();

router.use(protect, allowRoles('admin'));

router.get('/ngos', getNgos);
router.patch('/ngos/:id/verify', setNgoVerification);
router.get('/stats', getStats);

export default router;
