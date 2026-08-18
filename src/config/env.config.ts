import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  FRONTEND_URL: z.string().default('http://localhost:3001'),
  MONGODB_URI: z.string().url().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API Key is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API Secret is required'),
  VAPID_PUBLIC_KEY: z.string().min(1, 'VAPID Public Key is required'),
  VAPID_PRIVATE_KEY: z.string().min(1, 'VAPID Private Key is required'),
  GEMINI_API_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
