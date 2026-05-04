/**
 * Zod validation schema for POST /api/v1/sites payload.
 * See docs/architecture/api-first.md §Error Contract
 */

import { z } from 'zod';

export const createSiteSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .max(253, 'Domain must be at most 253 characters'),
});

export type CreateSitePayload = z.infer<typeof createSiteSchema>;
