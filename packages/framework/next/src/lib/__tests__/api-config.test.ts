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
const { igrpSetAccessClientConfig, igrpGetAccessClientConfig, igrpResetAccessClientConfig } =
  await import('../api-config');

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
