import mongoose from 'mongoose';
import { env } from '@/config/env.config';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(env.MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB Connected successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};
