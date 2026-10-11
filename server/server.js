import 'dotenv/config'; // loads variables from .env into process.env
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import setupSocket from './socket.js';
import Donation from './models/Donation.js';
import authRoutes from './routes/authRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import ngoRoutes from './routes/ngoRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const PORT = process.env.PORT || 5000;

// Websites allowed to call this API. Can be a comma separated list.
// Render gives just the host name ("my-app.onrender.com"), so add https:// when missing.
const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())
  .map((url) => (url.startsWith('http') ? url : `https://${url}`));

const app = express();
const server = http.createServer(app); // Socket.IO needs the raw http server
const io = new Server(server, { cors: { origin: CLIENT_URLS } });

// ---------- Middleware ----------
app.use(cors({ origin: CLIENT_URLS }));
app.use(express.json());
app.set('io', io); // lets controllers use req.app.get('io') to send live events

// ---------- Routes ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/admin', adminRoutes);

// Unknown route
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler (Express 5 sends errors from async functions here automatically)
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Email is already registered' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

// ---------- Background job: mark old food as expired every minute ----------
function startExpiryJob() {
  setInterval(async () => {
    try {
      const result = await Donation.updateMany(
        { status: 'available', expiresAt: { $lte: new Date() } },
        { status: 'expired' }
      );
      if (result.modifiedCount > 0) io.emit('donations:changed');
    } catch (err) {
      console.error('Expiry job failed:', err.message);
    }
  }, 60 * 1000);
}

// ---------- Start ----------
await connectDB();
setupSocket(io);
startExpiryJob();
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
