import mongoose from 'mongoose';

// Connects to MongoDB using the URI from .env
export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1); // no point running the API without a database
  }
}
