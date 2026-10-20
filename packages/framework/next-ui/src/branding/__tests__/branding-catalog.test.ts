import { describe, expect, it } from 'vitest';

import { IGRP_BRANDING_CORE_TOKENS, isTokenName } from '../index.js';

describe('IGRP_BRANDING_CORE_TOKENS', () => {
  it('lists the 50 core tokens exactly once, all well formed', () => {
    const names = IGRP_BRANDING_CORE_TOKENS.map((t) => t.name);
    expect(names).toHaveLength(50);
    expect(new Set(names).size).toBe(50);
    expect(names.every(isTokenName)).toBe(true);
  });

  it('does not offer --radius, which is not editable in v1', () => {
    expect(IGRP_BRANDING_CORE_TOKENS.map((t) => t.name)).not.toContain('--radius');
  });
});
