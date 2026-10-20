import { describe, expect, it } from 'vitest';

import type { IGRPConfigArgs } from '@igrp/framework-next-types';

import { resolveBrandingToken } from '../token.js';

const base = (session: unknown): IGRPConfigArgs =>
  ({ layout: { session } }) as unknown as IGRPConfigArgs;

describe('resolveBrandingToken', () => {
  it('returns the session access token when present', () => {
    expect(resolveBrandingToken(base({ accessToken: 'abc' }))).toBe('abc');
  });

  it('returns undefined without a session or without a string token', () => {
    expect(resolveBrandingToken(base(null))).toBeUndefined();
    expect(resolveBrandingToken(base({ accessToken: 42 }))).toBeUndefined();
  });
});
