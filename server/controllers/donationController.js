import Donation from '../models/Donation.js';
import User from '../models/User.js';
import { generateOtp, distanceKm, isInvolved, hideOtps } from '../utils/helpers.js';

// Fields of related users we want to send to the frontend
const USER_FIELDS = 'name phone address location';

// Tell every connected browser that donations changed, so dashboards can refresh.
// Also tell people tracking this one donation (they are in room "donation:<id>").
function broadcastChange(req, donation) {
  const io = req.app.get('io');
  io.emit('donations:changed');
  io.to(`donation:${donation._id}`).emit('donation:updated', { status: donation.status });
}

// ---------------- DONOR ----------------

// POST /api/donations  -> donor adds food
export async function createDonation(req, res) {
  const { title, category, foodType, quantity, unit, expiresAt, notes, pickupAddress, lat, lng } = req.body;

  if (lat == null || lng == null) {
    return res.status(400).json({ message: 'Pickup location is required' });
  }
  if (!expiresAt || new Date(expiresAt) <= new Date()) {
    return res.status(400).json({ message: 'Expiry time must be in the future' });
  }

  const donation = await Donation.create({
    donor: req.user._id,
    title,
    category,
    foodType,
    quantity,
    unit,
    expiresAt,
    notes,
    pickupAddress,
    location: { type: 'Point', coordinates: [lng, lat] }, // GeoJSON = [lng, lat]
    pickupOtp: generateOtp(),
    deliveryOtp: generateOtp(),
  });

  broadcastChange(req, donation);
  res.status(201).json(hideOtps(donation, req.user));
}

// GET /api/donations/my  -> donations created by the logged-in donor
export async function getMyDonations(req, res) {
  const donations = await Donation.find({ donor: req.user._id })
    .populate('ngo', USER_FIELDS)
    .populate('deliveryPerson', 'name phone')
    .sort({ createdAt: -1 });

  res.json(donations.map((d) => hideOtps(d, req.user)));
}

// PATCH /api/donations/:id/cancel  -> donor cancels (only while nobody has claimed it)
export async function cancelDonation(req, res) {
  const donation = await Donation.findOneAndUpdate(
    { _id: req.params.id, donor: req.user._id, status: 'available' },
    { status: 'cancelled' },
    { returnDocument: 'after' }
  );
  if (!donation) return res.status(400).json({ message: 'Only unclaimed donations can be cancelled' });

  broadcastChange(req, donation);
  res.json(hideOtps(donation, req.user));
}

// ---------------- NGO ----------------

// GET /api/donations/nearby?radius=10  -> available food near the NGO, most urgent first
export async function getNearbyDonations(req, res) {
  if (!req.user.isVerified) {
    return res.status(403).json({ message: 'Your NGO is waiting for admin verification' });
  }

  const radiusKm = Math.min(Number(req.query.radius) || 10, 100);
  const { lat, lng } = req.user.location;

  const donations = await Donation.find({
    status: 'available',
    expiresAt: { $gt: new Date() },
    // $centerSphere takes the radius in "radians" = km / Earth radius
    location: { $geoWithin: { $centerSphere: [[lng, lat], radiusKm / 6378.1] } },
  })
    .populate('donor', 'name phone')
    .sort({ expiresAt: 1 }); // food that expires soonest comes first

  // add the distance from the NGO to every donation
  const result = donations.map((d) => {
    const [dLng, dLat] = d.location.coordinates;
    return { ...hideOtps(d, req.user), distanceKm: Number(distanceKm(lat, lng, dLat, dLng).toFixed(1)) };
  });

  res.json(result);
}

// PATCH /api/donations/:id/claim  -> NGO claims food
export async function claimDonation(req, res) {
  if (!req.user.isVerified) {
    return res.status(403).json({ message: 'Your NGO is waiting for admin verification' });
  }

  // Find + update in ONE atomic step, so two NGOs can never claim the same food
  const donation = await Donation.findOneAndUpdate(
    { _id: req.params.id, status: 'available', expiresAt: { $gt: new Date() } },
    { status: 'claimed', ngo: req.user._id, claimedAt: new Date() },
    { returnDocument: 'after' }
  );
  if (!donation) return res.status(400).json({ message: 'Sorry, this food was already claimed or has expired' });

  broadcastChange(req, donation);
  res.json(hideOtps(donation, req.user));
}

// GET /api/donations/claimed  -> donations claimed by this NGO
export async function getClaimedDonations(req, res) {
  const donations = await Donation.find({ ngo: req.user._id })
    .populate('donor', USER_FIELDS)
    .populate('deliveryPerson', 'name phone')
    .sort({ claimedAt: -1 });

  res.json(donations.map((d) => hideOtps(d, req.user)));
}

// PATCH /api/donations/:id/assign  { deliveryPersonId }  -> NGO assigns one of its delivery staff
export async function assignDelivery(req, res) {
  const staff = await User.findOne({ _id: req.body.deliveryPersonId, role: 'delivery', ngo: req.user._id });
  if (!staff) return res.status(400).json({ message: 'Delivery person not found in your team' });

  // can (re)assign until the food is picked up
  const donation = await Donation.findOneAndUpdate(
    { _id: req.params.id, ngo: req.user._id, status: { $in: ['claimed', 'assigned'] } },
    { status: 'assigned', deliveryPerson: staff._id },
    { returnDocument: 'after' }
  );
  if (!donation) return res.status(400).json({ message: 'This donation cannot be assigned now' });

  broadcastChange(req, donation);
  res.json(hideOtps(donation, req.user));
}

// ---------------- DELIVERY ----------------

// GET /api/donations/tasks  -> donations assigned to the logged-in delivery person
export async function getMyTasks(req, res) {
  const donations = await Donation.find({ deliveryPerson: req.user._id })
    .populate('donor', USER_FIELDS)
    .populate('ngo', USER_FIELDS)
    .sort({ updatedAt: -1 });

  res.json(donations.map((d) => hideOtps(d, req.user)));
}

// Shared logic for pickup and delivery: check OTP and move to the next status
async function verifyOtpAndUpdate(req, res, { fromStatus, toStatus, otpField, timeField }) {
  const donation = await Donation.findOne({
    _id: req.params.id,
    deliveryPerson: req.user._id,
    status: fromStatus,
  });
  if (!donation) return res.status(400).json({ message: 'This task is not in the right stage' });

  if (String(req.body.otp).trim() !== donation[otpField]) {
    return res.status(400).json({ message: 'Wrong OTP, please check again' });
  }

  donation.status = toStatus;
  donation[timeField] = new Date();
  await donation.save();

  broadcastChange(req, donation);
  res.json(hideOtps(donation, req.user));
}

// PATCH /api/donations/:id/pickup  { otp }  -> delivery person collected the food from donor
export function confirmPickup(req, res) {
  return verifyOtpAndUpdate(req, res, {
    fromStatus: 'assigned',
    toStatus: 'picked_up',
    otpField: 'pickupOtp',
    timeField: 'pickedUpAt',
  });
}

// PATCH /api/donations/:id/deliver  { otp }  -> food handed over to the NGO
export function confirmDelivery(req, res) {
  return verifyOtpAndUpdate(req, res, {
    fromStatus: 'picked_up',
    toStatus: 'delivered',
    otpField: 'deliveryOtp',
    timeField: 'deliveredAt',
  });
}

// ---------------- SHARED ----------------

// GET /api/donations/:id  -> full details (only for people involved in this donation)
export async function getDonationById(req, res) {
  const donation = await Donation.findById(req.params.id)
    .populate('donor', USER_FIELDS)
    .populate('ngo', USER_FIELDS)
    .populate('deliveryPerson', 'name phone');

  if (!donation) return res.status(404).json({ message: 'Donation not found' });
  if (!isInvolved(donation, req.user)) {
    return res.status(403).json({ message: 'You are not part of this donation' });
  }

  res.json(hideOtps(donation, req.user));
}
