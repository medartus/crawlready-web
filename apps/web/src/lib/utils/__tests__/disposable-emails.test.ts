import { describe, expect, it } from 'vitest';

import { isDisposableEmail } from '../disposable-emails';

describe('isDisposableEmail', () => {
  it('blocks known disposable domains', () => {
    expect(isDisposableEmail('test@mailinator.com')).toBe(true);
    expect(isDisposableEmail('test@guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('test@tempmail.com')).toBe(true);
    expect(isDisposableEmail('test@yopmail.com')).toBe(true);
  });

  it('allows legitimate domains', () => {
    expect(isDisposableEmail('user@gmail.com')).toBe(false);
    expect(isDisposableEmail('user@company.io')).toBe(false);
    expect(isDisposableEmail('user@outlook.com')).toBe(false);
  });

  it('handles case insensitivity', () => {
    expect(isDisposableEmail('test@MAILINATOR.COM')).toBe(true);
    expect(isDisposableEmail('test@Tempmail.Com')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(isDisposableEmail('noemail')).toBe(false);
    expect(isDisposableEmail('')).toBe(false);
  });
});
