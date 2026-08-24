import { z } from 'zod';

export const broadcastAudienceSchema = z.enum(['all', 'verified', 'unverified']);

export const broadcastSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required').max(10000),
  audience: broadcastAudienceSchema.optional().default('all'),
});
