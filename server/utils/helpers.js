import jwt from 'jsonwebtoken';

// Creates a login token that is valid for 7 days
export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Random 4 digit OTP, e.g. "4821"
export function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Straight-line distance between two points in km (Haversine formula)
export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Returns the id of a field whether it is populated ({ _id }) or a plain ObjectId
const idOf = (field) => (field?._id ?? field)?.toString();

// Is this user part of this donation? (donor who gave it, NGO who claimed it, or delivery person)
export function isInvolved(donation, user) {
  const userId = user._id.toString();
  return (
    user.role === 'admin' ||
    idOf(donation.donor) === userId ||
    idOf(donation.ngo) === userId ||
    idOf(donation.deliveryPerson) === userId
  );
}

// Hide OTPs from people who should not see them:
// only the donor sees pickupOtp, only the NGO sees deliveryOtp
export function hideOtps(donation, user) {
  const data = donation.toObject ? donation.toObject() : { ...donation };
  if (user.role !== 'donor') delete data.pickupOtp;
  if (user.role !== 'ngo') delete data.deliveryOtp;
  return data;
}
