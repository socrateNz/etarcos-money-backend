import { v2 as cloudinary } from 'cloudinary';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import webPush from 'web-push';
import { env } from './env.config';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

webPush.setVapidDetails('mailto:support@etarcos-money.app', env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

export { cloudinary, google, webPush };
