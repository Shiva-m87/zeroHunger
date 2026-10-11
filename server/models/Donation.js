import mongoose from 'mongoose';

/*
  Life cycle of a donation (the "status" field):

  available -> claimed -> assigned -> picked_up -> delivered
      |
      +-> expired (nobody claimed it in time) / cancelled (donor cancelled)
*/
export const STATUSES = ['available', 'claimed', 'assigned', 'picked_up', 'delivered', 'expired', 'cancelled'];

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ---- Food details (metadata shown to NGOs) ----
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ['cooked', 'raw', 'packaged'], required: true },
    foodType: { type: String, enum: ['veg', 'non-veg'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, enum: ['servings', 'kg', 'packets'], default: 'servings' },
    expiresAt: { type: Date, required: true }, // food is safe to eat until this time
    notes: { type: String, trim: true }, // allergens, packaging, etc.

    // ---- Pickup place ----
    pickupAddress: { type: String, required: true, trim: true },
    // GeoJSON point so MongoDB can search "donations near me".
    // NOTE: GeoJSON order is [longitude, latitude]
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },

    // ---- Progress ----
    status: { type: String, enum: STATUSES, default: 'available' },
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // NGO who claimed it
    deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // OTPs prove the hand-over really happened:
    // donor tells pickupOtp to delivery person, NGO tells deliveryOtp to delivery person
    pickupOtp: String,
    deliveryOtp: String,

    // Last known position of the delivery person (updated live via Socket.IO)
    liveLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },

    claimedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

// Geospatial index - required for $geoWithin / $near queries
donationSchema.index({ location: '2dsphere' });

export default mongoose.model('Donation', donationSchema);
