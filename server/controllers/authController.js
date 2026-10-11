import User from '../models/User.js';
import { generateToken } from '../utils/helpers.js';

// POST /api/auth/register  (only donors and NGOs can sign up themselves)
export async function register(req, res) {
  const { name, email, password, phone, role, address, location } = req.body;

  if (!['donor', 'ngo'].includes(role)) {
    return res.status(400).json({ message: 'You can only register as a donor or an NGO' });
  }
  if (!location || location.lat == null || location.lng == null) {
    return res.status(400).json({ message: 'Please pick your location on the map' });
  }
  if (await User.findOne({ email })) {
    return res.status(400).json({ message: 'Email is already registered' });
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
    address,
    location,
    isVerified: role !== 'ngo', // NGOs must wait for admin approval
  });

  res.status(201).json({ token: generateToken(user._id), user });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  // password has "select: false" in the schema, so ask for it explicitly
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ token: generateToken(user._id), user });
}

// GET /api/auth/me  -> the currently logged-in user
export async function getMe(req, res) {
  res.json(req.user);
}
