import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// An in-memory stand-in for the redis client: enough of get/set/del/eval to
// check what the store sends, and a switch to make connect fail or hang.
const fake = vi.hoisted(() => {
  const state = {
    data: new Map<string, string>(),
    connect: vi.fn(async () => {}),
    createClient: vi.fn(),
    calls: [] as unknown[][],
  };
  state.createClient.mockImplementation(() => ({
    on: () => {},
    connect: state.connect,
    get: async (k: string) => state.data.get(k) ?? null,
    set: async (k: string, v: string, opts: { condition?: string }) => {
      state.calls.push(["set", k, v, opts]);
      if (opts.condition === "NX" && state.data.has(k)) return null;
      state.data.set(k, v);
      return "OK";
    },
    del: async (k: string) => Number(state.data.delete(k)),
    eval: async (
      _script: string,
      { keys, arguments: args }: { keys: string[]; arguments: string[] },
    ) => {
      // Mirrors RELEASE_LOCK_SCRIPT: delete only when the owner matches.
      if (state.data.get(keys[0]) !== args[0]) return 0;
      state.data.delete(keys[0]);
      return 1;
    },
  }));
  return state;
});
vi.mock("redis", () => ({ createClient: fake.createClient }));

const { createRedisSessionStore } = await import("../session-store");

// The lock methods are optional on IGRPSessionStore; this store has both.
const lockingStore = (url: string) =>
  createRedisSessionStore(url) as Required<
    ReturnType<typeof createRedisSessionStore>
  >;

beforeEach(() => {
  fake.data.clear();
  fake.calls = [];
  fake.connect.mockReset().mockResolvedValue(undefined);
  fake.createClient.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("createRedisSessionStore", () => {
  it("stores with a TTL in seconds, reads back and deletes", async () => {
    const store = createRedisSessionStore("redis://x");
    await store.set("s1", "enc", 60);
    expect(fake.calls[0][3]).toEqual({ expiration: { type: "EX", value: 60 } });
    await expect(store.get("s1")).resolves.toBe("enc");
    await store.delete("s1");
    await expect(store.get("s1")).resolves.toBeNull();
  });

  it("connects once and reuses the client", async () => {
    const store = createRedisSessionStore("redis://x");
    await Promise.all([store.get("a"), store.get("b"), store.set("c", "v", 1)]);
    expect(fake.createClient).toHaveBeenCalledOnce();
    expect(fake.createClient).toHaveBeenCalledWith(
      expect.objectContaining({ url: "redis://x", disableOfflineQueue: true }),
    );
  });

  it("retries the connection on the next call after a failed connect", async () => {
    fake.connect.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const store = createRedisSessionStore("redis://x");
    await expect(store.get("a")).rejects.toThrow("ECONNREFUSED");
    await expect(store.get("a")).resolves.toBeNull();
    expect(fake.createClient).toHaveBeenCalledTimes(2);
  });

  it("fails a call that hangs instead of holding the request", async () => {
    vi.useFakeTimers();
    fake.connect.mockReturnValue(new Promise(() => {}));
    const store = createRedisSessionStore("redis://x");
    const pending = expect(store.get("a")).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(2000);
    await pending;
  });

  describe("refresh lock", () => {
    it("lets one owner in at a time, with a TTL in ms", async () => {
      const store = lockingStore("redis://x");
      await expect(store.acquireLock("l", "A", 5000)).resolves.toBe(true);
      await expect(store.acquireLock("l", "B", 5000)).resolves.toBe(false);
      expect(fake.calls[0][3]).toEqual({
        condition: "NX",
        expiration: { type: "PX", value: 5000 },
      });
    });

    it("is released only by its owner", async () => {
      const store = lockingStore("redis://x");
      await store.acquireLock("l", "A", 5000);
      await store.releaseLock("l", "B");
      await expect(store.acquireLock("l", "B", 5000)).resolves.toBe(false);
      await store.releaseLock("l", "A");
      await expect(store.acquireLock("l", "B", 5000)).resolves.toBe(true);
    });
  });
});
