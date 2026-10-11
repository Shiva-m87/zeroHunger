import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Checks the "Authorization: Bearer <token>" header and puts the logged-in user on req.user
export async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in first' });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }

  req.user = await User.findById(decoded.id);
  if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
  next();
}

// Allows the request only for the given roles, e.g. allowRoles('ngo', 'admin')
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to do this' });
    }
    next();
  };
}
