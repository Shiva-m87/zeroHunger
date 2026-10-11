import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/*
  One collection for every type of user. The "role" field decides what they can do:
  - donor    : restaurants / households who give food
  - ngo      : organisations who claim food (must be verified by admin first)
  - delivery : delivery staff, always belongs to one NGO (see "ngo" field)
  - admin    : verifies NGOs and sees platform stats
*/
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false }, // never returned by default
    phone: { type: String, trim: true },
    role: { type: String, enum: ['donor', 'ngo', 'delivery', 'admin'], required: true },
    address: { type: String, trim: true },

    // Home/office location, used as default pickup point (donor) or drop point (NGO)
    location: {
      lat: Number,
      lng: Number,
    },

    // NGOs start unverified; everyone else is verified automatically
    isVerified: { type: Boolean, default: true },

    // Only for delivery staff: which NGO they work for
    ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Hash the password before saving (only when it was changed)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare a plain password with the stored hash
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Remove the password whenever a user is converted to JSON (sent in a response)
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
