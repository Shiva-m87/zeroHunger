/*
  Fills the database with demo data so you can try the app quickly.
  Run:  npm run seed
  WARNING: this deletes all existing users and donations!
*/
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Donation from './models/Donation.js';
import { generateOtp } from './utils/helpers.js';

const hoursFromNow = (h) => new Date(Date.now() + h * 60 * 60 * 1000);

await connectDB();
await User.deleteMany();
await Donation.deleteMany();

// Demo locations around New Delhi
// (User.create one by one so the password-hashing hook runs)
await User.create({
  name: 'Platform Admin',
  email: 'admin@zerohunger.test',
  password: 'admin123',
  role: 'admin',
});

const donor = await User.create({
  name: 'Spice Garden Restaurant',
  email: 'donor@zerohunger.test',
  password: 'donor123',
  phone: '9876500001',
  role: 'donor',
  address: 'Connaught Place, New Delhi',
  location: { lat: 28.6315, lng: 77.2167 },
});

const ngo = await User.create({
  name: 'Annapurna Food Bank',
  email: 'ngo@zerohunger.test',
  password: 'ngo123',
  phone: '9876500002',
  role: 'ngo',
  address: 'Karol Bagh, New Delhi',
  location: { lat: 28.6519, lng: 77.1909 },
  isVerified: true,
});

await User.create({
  name: 'Helping Hands Trust',
  email: 'ngo2@zerohunger.test',
  password: 'ngo123',
  phone: '9876500003',
  role: 'ngo',
  address: 'Lajpat Nagar, New Delhi',
  location: { lat: 28.5677, lng: 77.2433 },
  isVerified: false, // shows up in admin's "pending verification" list
});

await User.create({
  name: 'Ravi Kumar',
  email: 'delivery@zerohunger.test',
  password: 'delivery123',
  phone: '9876500004',
  role: 'delivery',
  ngo: ngo._id,
});

const sampleFood = [
  { title: 'Veg Biryani', category: 'cooked', foodType: 'veg', quantity: 40, unit: 'servings', hours: 3, notes: 'Packed in foil containers' },
  { title: 'Chapati & Dal', category: 'cooked', foodType: 'veg', quantity: 25, unit: 'servings', hours: 5, notes: 'Contains gluten' },
  { title: 'Rice & Wheat Flour', category: 'raw', foodType: 'veg', quantity: 15, unit: 'kg', hours: 72, notes: 'Sealed bags' },
];

for (const f of sampleFood) {
  await Donation.create({
    donor: donor._id,
    title: f.title,
    category: f.category,
    foodType: f.foodType,
    quantity: f.quantity,
    unit: f.unit,
    notes: f.notes,
    expiresAt: hoursFromNow(f.hours),
    pickupAddress: donor.address,
    location: { type: 'Point', coordinates: [donor.location.lng, donor.location.lat] },
    pickupOtp: generateOtp(),
    deliveryOtp: generateOtp(),
  });
}

console.log('Demo data created. Logins:');
console.log('  admin@zerohunger.test    / admin123');
console.log('  donor@zerohunger.test    / donor123');
console.log('  ngo@zerohunger.test      / ngo123      (verified)');
console.log('  ngo2@zerohunger.test     / ngo123      (not verified)');
console.log('  delivery@zerohunger.test / delivery123');

await mongoose.disconnect();
