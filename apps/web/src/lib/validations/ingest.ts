/**
 * Zod validation schema for POST /api/v1/ingest payload.
 * See docs/architecture/api-first.md §Error Contract
 */

import { z } from 'zod';

export const ingestSchema = z.object({
  s: z
    .string()
    .min(1, 'Site key is required')
    .startsWith('cr_live_', 'Site key must start with cr_live_')
    .length(20, 'Site key must be 20 characters'),
  p: z
    .string()
    .min(1, 'Path is required')
    .max(2048, 'Path must be at most 2048 characters'),
  b: z
    .string()
    .min(1, 'Bot name is required')
    .max(100, 'Bot name must be at most 100 characters'),
  t: z
    .number()
    .int('Timestamp must be an integer'),
  src: z
    .enum(['middleware', 'js'])
    .optional(),
});

export type IngestPayload = z.infer<typeof ingestSchema>;
