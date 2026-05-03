import { describe, expect, it } from 'vitest';

import { checkBudget, recordCredit } from '../budget';

describe('budget', () => {
  it('allows scans when under budget', () => {
    const result = checkBudget();

    expect(result.allowed).toBe(true);
    expect(result.creditsRemaining).toBeGreaterThan(0);
  });

  it('tracks credits after recording', () => {
    const before = checkBudget();
    recordCredit(1);
    const after = checkBudget();

    expect(after.creditsUsed).toBe(before.creditsUsed + 1);
  });
});
