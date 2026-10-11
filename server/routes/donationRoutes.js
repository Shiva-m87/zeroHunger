import { Router } from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import {
  createDonation,
  getMyDonations,
  cancelDonation,
  getNearbyDonations,
  claimDonation,
  getClaimedDonations,
  assignDelivery,
  getMyTasks,
  confirmPickup,
  confirmDelivery,
  getDonationById,
} from '../controllers/donationController.js';

const router = Router();

// every donation route needs a logged-in user
router.use(protect);

// Donor
router.post('/', allowRoles('donor'), createDonation);
router.get('/my', allowRoles('donor'), getMyDonations);
router.patch('/:id/cancel', allowRoles('donor'), cancelDonation);

// NGO
router.get('/nearby', allowRoles('ngo'), getNearbyDonations);
router.get('/claimed', allowRoles('ngo'), getClaimedDonations);
router.patch('/:id/claim', allowRoles('ngo'), claimDonation);
router.patch('/:id/assign', allowRoles('ngo'), assignDelivery);

// Delivery
router.get('/tasks', allowRoles('delivery'), getMyTasks);
router.patch('/:id/pickup', allowRoles('delivery'), confirmPickup);
router.patch('/:id/deliver', allowRoles('delivery'), confirmDelivery);

// Anyone involved in the donation (keep this LAST so "/my", "/nearby"... are matched first)
router.get('/:id', getDonationById);

export default router;
