import { describe, it, expect, vi, beforeEach } from 'vitest';

// React.cache is a pass-through in test environments (no request scope).
// We mock it as a zero-arg memoize so the module under test loads without React
// internals and set-then-read within the same test works as expected.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T): T => {
      const result = fn();
      return (() => result) as T;
    },
  };
});

// Import AFTER vi.mock so the mock is in place when the module initialises.
const {
  igrpSetAccessClientConfig,
  igrpGetAccessClientConfig,
  igrpResetAccessClientConfig,
  igrpWithAccessClientConfig,
  igrpResolveDefaultTimeout,
} = await import('../api-config.js');

describe('igrpSetAccessClientConfig / igrpGetAccessClientConfig', () => {
  beforeEach(() => {
    igrpResetAccessClientConfig();
  });

  it('returns empty defaults before any config is set', () => {
    const config = igrpGetAccessClientConfig();
    expect(config.token).toBe('');
    expect(config.baseUrl).toBe('');
    expect(config.timeout).toBe(10_000);
  });

  it('returns the config that was set', () => {
    igrpSetAccessClientConfig({ token: 'tok123', baseUrl: 'https://api.example.com' });
    const config = igrpGetAccessClientConfig();
    expect(config.token).toBe('tok123');
    expect(config.baseUrl).toBe('https://api.example.com');
    expect(config.timeout).toBe(10_000);
  });

  it('preserves explicit timeout when provided', () => {
    igrpSetAccessClientConfig({ token: 't', baseUrl: 'http://x', timeout: 5_000 });
    expect(igrpGetAccessClientConfig().timeout).toBe(5_000);
  });

  it('igrpResetAccessClientConfig restores defaults', () => {
    igrpSetAccessClientConfig({ token: 'tok', baseUrl: 'http://api' });
    igrpResetAccessClientConfig();
    const config = igrpGetAccessClientConfig();
    expect(config.token).toBe('');
    expect(config.baseUrl).toBe('');
    expect(config.timeout).toBe(10_000);
  });
});

describe('igrpWithAccessClientConfig', () => {
  it('restores the enclosing config after the callback', async () => {
    igrpSetAccessClientConfig({ token: 'user-token', baseUrl: 'https://am.example' });

    const inner = await igrpWithAccessClientConfig(
      { token: 'service-token' },
      async () => igrpGetAccessClientConfig().token,
    );

    expect(inner).toBe('service-token');
    // The scope-escape this exists to prevent: with igrpSetAccessClientConfig
    // the nested write lands on the ENCLOSING context's object (Object.assign)
    // and the user's token stays clobbered for the rest of the request.
    expect(igrpGetAccessClientConfig().token).toBe('user-token');
  });

  it('inherits unspecified fields from the enclosing config', async () => {
    igrpSetAccessClientConfig({
      token: 'user-token',
      baseUrl: 'https://am.example',
      timeout: 1234,
    });

    const seen = await igrpWithAccessClientConfig({ token: 'other' }, async () =>
      igrpGetAccessClientConfig(),
    );

    expect(seen.baseUrl).toBe('https://am.example');
    expect(seen.timeout).toBe(1234);
  });

  it('does not share the store object with the enclosing context', async () => {
    igrpSetAccessClientConfig({ token: 'user-token', baseUrl: 'https://am.example' });
    const outer = igrpGetAccessClientConfig();

    await igrpWithAccessClientConfig({ token: 'service' }, async () => {
      // A mutation inside the scope must not reach the outer object.
      igrpGetAccessClientConfig().baseUrl = 'https://mutated.example';
    });

    expect(outer.baseUrl).toBe('https://am.example');
  });
});

describe('igrpResolveDefaultTimeout', () => {
  it('defaults to 10s when the variable is unset', () => {
    expect(igrpResolveDefaultTimeout({})).toBe(10_000);
  });

  it('honours IGRP_ACCESS_MANAGEMENT_TIMEOUT', () => {
    // The Server Action / Route Handler channel: those contexts never see
    // `apiManagementConfig.timeout`, so without this the configured value was
    // silently the 10s default there.
    expect(igrpResolveDefaultTimeout({ IGRP_ACCESS_MANAGEMENT_TIMEOUT: '25000' })).toBe(25_000);
  });

  it('falls back rather than producing a degenerate AbortSignal', () => {
    for (const raw of ['0', '-1', 'abc', 'Infinity', '']) {
      expect(igrpResolveDefaultTimeout({ IGRP_ACCESS_MANAGEMENT_TIMEOUT: raw })).toBe(10_000);
    }
  });
});
