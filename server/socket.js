import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Donation from './models/Donation.js';
import { isInvolved } from './utils/helpers.js';

/*
  Real-time live tracking with Socket.IO

  1. Donor / NGO open the tracking page  -> emit "track:join" (donationId)  -> they join room "donation:<id>"
  2. Delivery person's phone sends GPS   -> emit "location:update" { donationId, lat, lng }
  3. Server saves it and sends "location:changed" to everyone in that room
*/
export default function setupSocket(io) {
  // Only logged-in users can connect (the token is sent from the frontend)
  io.use(async (socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
      socket.user = await User.findById(id);
      if (!socket.user) throw new Error('User not found');
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Someone wants live updates for one donation
    socket.on('track:join', async (donationId) => {
      try {
        const donation = await Donation.findById(donationId);
        if (donation && isInvolved(donation, socket.user)) {
          socket.join(`donation:${donationId}`);
        }
      } catch (err) {
        console.error('track:join failed:', err.message);
      }
    });

    socket.on('track:leave', (donationId) => {
      socket.leave(`donation:${donationId}`);
    });

    // Delivery person sends their current GPS position
    socket.on('location:update', async ({ donationId, lat, lng }) => {
      try {
        if (socket.user.role !== 'delivery') return;

        const donation = await Donation.findOne({
          _id: donationId,
          deliveryPerson: socket.user._id,
          status: { $in: ['assigned', 'picked_up'] }, // only while the delivery is active
        });
        if (!donation) return;

        donation.liveLocation = { lat, lng, updatedAt: new Date() };
        await donation.save();

        io.to(`donation:${donationId}`).emit('location:changed', donation.liveLocation);
      } catch (err) {
        console.error('location:update failed:', err.message);
      }
    });
  });
}
