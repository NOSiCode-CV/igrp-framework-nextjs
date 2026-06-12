import { describe, it, expect, vi, afterEach } from 'vitest';
import type { JWT } from '../jwt';
import { createInMemoryTokenRecoveryStore } from '../token-store';

function makeJwt(overrides: Partial<JWT> = {}): JWT {
  return {
    accessToken: 'at-new',
    refreshToken: 'rt-new',
    idToken: 'id-new',
    expiresAt: Date.now() + 180_000,
    ...overrides,
  } as JWT;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createInMemoryTokenRecoveryStore', () => {
  it('returns null for an unknown key', async () => {
    const store = createInMemoryTokenRecoveryStore();
    expect(await store.get('never-seen')).toBeNull();
  });

  it('round-trips a stored result', async () => {
    const store = createInMemoryTokenRecoveryStore();
    const jwt = makeJwt();
    await store.set('consumed-rt', jwt, 180_000);
    expect(await store.get('consumed-rt')).toEqual(jwt);
  });

  it('expires entries after their TTL', async () => {
    vi.useFakeTimers();
    const store = createInMemoryTokenRecoveryStore();
    await store.set('consumed-rt', makeJwt(), 1_000);
    vi.advanceTimersByTime(1_001);
    expect(await store.get('consumed-rt')).toBeNull();
  });

  it('does not delete on read — two reads of the same entry both succeed', async () => {
    const store = createInMemoryTokenRecoveryStore();
    await store.set('consumed-rt', makeJwt(), 180_000);
    expect(await store.get('consumed-rt')).not.toBeNull();
    expect(await store.get('consumed-rt')).not.toBeNull();
  });

  it('evicts the oldest entry when full', async () => {
    const store = createInMemoryTokenRecoveryStore({ maxEntries: 2 });
    await store.set('rt-1', makeJwt(), 180_000);
    await store.set('rt-2', makeJwt(), 180_000);
    await store.set('rt-3', makeJwt(), 180_000);
    expect(await store.get('rt-1')).toBeNull();
    expect(await store.get('rt-3')).not.toBeNull();
  });

  it('overwriting an existing key at capacity does not evict another entry', async () => {
    const store = createInMemoryTokenRecoveryStore({ maxEntries: 2 });
    await store.set('rt-1', makeJwt(), 180_000);
    await store.set('rt-2', makeJwt(), 180_000);
    await store.set('rt-2', makeJwt({ accessToken: 'at-updated' }), 180_000);
    expect(await store.get('rt-1')).not.toBeNull();
    expect((await store.get('rt-2'))?.accessToken).toBe('at-updated');
  });
});
