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

export const updateSiteSchema = z.object({
  integration_method: z
    .enum(['middleware', 'script_tag'])
    .optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export type UpdateSitePayload = z.infer<typeof updateSiteSchema>;
