import { describe, it, expect, vi, afterEach } from 'vitest';
import type { JWT } from '../jwt';
import {
  createInMemoryTokenRecoveryStore,
  createRedisTokenRecoveryStore,
  type IGRPRedisLikeClient,
} from '../token-store';

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
});

describe('createRedisTokenRecoveryStore', () => {
  function makeFakeRedis() {
    const data = new Map<string, string>();
    const client: IGRPRedisLikeClient = {
      get: vi.fn(async (key: string) => data.get(key) ?? null),
      set: vi.fn(async (key: string, value: string, _options: { PX: number }) => {
        data.set(key, value);
        return 'OK';
      }),
    };
    return { client, data };
  }

  it('round-trips a stored result through JSON', async () => {
    const { client } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client);
    const jwt = makeJwt();
    await store.set('consumed-rt', jwt, 180_000);
    expect(await store.get('consumed-rt')).toEqual(jwt);
  });

  it('passes the TTL to the client as PX milliseconds', async () => {
    const { client } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client);
    await store.set('consumed-rt', makeJwt(), 42_000);
    expect(client.set).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      PX: 42_000,
    });
  });

  it('never uses the raw refresh token as a key (keys are hashed)', async () => {
    const { client, data } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client);
    await store.set('consumed-rt-secret-value', makeJwt(), 180_000);
    for (const key of data.keys()) {
      expect(key).not.toContain('consumed-rt-secret-value');
      expect(key).toMatch(/^igrp:oidc:rotated:[0-9a-f]{64}$/);
    }
  });

  it('honors a custom keyPrefix', async () => {
    const { client, data } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client, { keyPrefix: 'custom:' });
    await store.set('consumed-rt', makeJwt(), 180_000);
    expect([...data.keys()][0]).toMatch(/^custom:[0-9a-f]{64}$/);
  });

  it('returns null on malformed JSON instead of throwing', async () => {
    const { client, data } = makeFakeRedis();
    const store = createRedisTokenRecoveryStore(client);
    await store.set('consumed-rt', makeJwt(), 180_000);
    const key = [...data.keys()][0]!;
    data.set(key, 'not-json{');
    expect(await store.get('consumed-rt')).toBeNull();
  });
});
