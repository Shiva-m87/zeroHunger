import User from '../models/User.js';
import Donation from '../models/Donation.js';

// GET /api/admin/ngos  -> all NGOs, unverified ones first
export async function getNgos(req, res) {
  const ngos = await User.find({ role: 'ngo' }).sort({ isVerified: 1, createdAt: -1 });
  res.json(ngos);
}

// PATCH /api/admin/ngos/:id/verify  { isVerified: true/false }
export async function setNgoVerification(req, res) {
  const ngo = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'ngo' },
    { isVerified: Boolean(req.body.isVerified) },
    { returnDocument: 'after' }
  );
  if (!ngo) return res.status(404).json({ message: 'NGO not found' });
  res.json(ngo);
}

// GET /api/admin/stats  -> numbers for the admin dashboard
export async function getStats(req, res) {
  const [donors, ngos, deliveryStaff, totalDonations, delivered, active, expired] = await Promise.all([
    User.countDocuments({ role: 'donor' }),
    User.countDocuments({ role: 'ngo' }),
    User.countDocuments({ role: 'delivery' }),
    Donation.countDocuments(),
    Donation.countDocuments({ status: 'delivered' }),
    Donation.countDocuments({ status: { $in: ['available', 'claimed', 'assigned', 'picked_up'] } }),
    Donation.countDocuments({ status: 'expired' }),
  ]);

  res.json({ donors, ngos, deliveryStaff, totalDonations, delivered, active, expired });
}
