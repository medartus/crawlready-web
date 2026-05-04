import { describe, expect, it } from 'vitest';

import { createSiteSchema, updateSiteSchema } from '../sites';

describe('createSiteSchema', () => {
  it('accepts a valid domain', () => {
    const result = createSiteSchema.safeParse({ domain: 'example.com' });

    expect(result.success).toBe(true);
  });

  it('accepts a domain with subdomain', () => {
    const result = createSiteSchema.safeParse({ domain: 'app.example.com' });

    expect(result.success).toBe(true);
  });

  it('rejects empty domain', () => {
    const result = createSiteSchema.safeParse({ domain: '' });

    expect(result.success).toBe(false);
  });

  it('rejects missing domain', () => {
    const result = createSiteSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('rejects domain longer than 253 characters', () => {
    const result = createSiteSchema.safeParse({ domain: 'a'.repeat(254) });

    expect(result.success).toBe(false);
  });
});

describe('updateSiteSchema', () => {
  it('accepts valid integration_method middleware', () => {
    const result = updateSiteSchema.safeParse({ integration_method: 'middleware' });

    expect(result.success).toBe(true);
  });

  it('accepts valid integration_method script_tag', () => {
    const result = updateSiteSchema.safeParse({ integration_method: 'script_tag' });

    expect(result.success).toBe(true);
  });

  it('rejects invalid integration_method', () => {
    const result = updateSiteSchema.safeParse({ integration_method: 'invalid' });

    expect(result.success).toBe(false);
  });

  it('rejects empty object (no fields provided)', () => {
    const result = updateSiteSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
