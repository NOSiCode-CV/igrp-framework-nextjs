import { describe, it, expect } from 'vitest';

import { igrpIsAllowedBy } from '../authorization.js';

const holds = (granted: string[]) => (name: string) => granted.includes(name);

describe('igrpIsAllowedBy', () => {
  /**
   * Regression: `[].every(...)` is `true`, so `mode: 'all'` — the DEFAULT —
   * rendered gated children to everyone for an empty list, while `mode: 'any'`
   * denied the same input. A gate must not fail open.
   */
  it('denies an empty list in both modes', () => {
    expect(igrpIsAllowedBy([], 'all', holds([]))).toBe(false);
    expect(igrpIsAllowedBy([], 'any', holds([]))).toBe(false);
    expect(igrpIsAllowedBy([], 'all', holds(['anything']))).toBe(false);
  });

  it('requires every permission in "all" mode', () => {
    expect(igrpIsAllowedBy(['a', 'b'], 'all', holds(['a', 'b']))).toBe(true);
    expect(igrpIsAllowedBy(['a', 'b'], 'all', holds(['a']))).toBe(false);
  });

  it('requires one permission in "any" mode', () => {
    expect(igrpIsAllowedBy(['a', 'b'], 'any', holds(['b']))).toBe(true);
    expect(igrpIsAllowedBy(['a', 'b'], 'any', holds(['c']))).toBe(false);
  });
});
