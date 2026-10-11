import User from '../models/User.js';

// GET /api/ngo/staff  -> delivery people of this NGO
export async function getStaff(req, res) {
  const staff = await User.find({ role: 'delivery', ngo: req.user._id }).sort({ createdAt: -1 });
  res.json(staff);
}

// POST /api/ngo/staff  -> NGO creates a login for its own delivery person
export async function addStaff(req, res) {
  const { name, email, password, phone } = req.body;

  if (await User.findOne({ email })) {
    return res.status(400).json({ message: 'Email is already registered' });
  }

  const staff = await User.create({
    name,
    email,
    password,
    phone,
    role: 'delivery',
    ngo: req.user._id, // links the delivery person to this NGO
  });

  res.status(201).json(staff);
}
