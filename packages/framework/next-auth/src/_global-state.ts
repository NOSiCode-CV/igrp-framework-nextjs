/**
 * Process-wide state slots.
 *
 * ## Why this exists
 *
 * `tsup` builds this package with `splitting: false`, so every entry point
 * (`dist/config.js`, `dist/oidc.js`, …) inlines its own copy of every module it
 * imports. Next.js can also instantiate a module once per server layer. A plain
 * module-level `const cache = new Map()` therefore exists as SEVERAL
 * independent objects in one running process — one per entry chunk that pulled
 * the module in.
 *
 * That is not theoretical here: a template imports `withIGRPAuth` from
 * `/config` and `buildEndSessionUrl` from `/oidc`, so both chunks load. Before
 * this module, that meant two OpenID discovery caches (an extra 4s-ceiling
 * round-trip on the logout path, which is exactly where the fetch timeouts
 * exist to bound latency), two in-flight refresh maps (the dedup that prevents
 * a rotation race logging users out), and "warn once per process" flags that
 * warned once per chunk.
 *
 * `Symbol.for(...)` resolves to the same symbol in every copy, so a slot keyed
 * on it is genuinely process-wide.
 *
 * Keep this file side-effect-free and dependency-free; it is inlined into every
 * entry that touches it.
 *
 * @internal
 */

const NAMESPACE = 'igrp.next-auth.';

/**
 * Returns the one process-wide value for `key`, creating it on first use.
 *
 * `create` must be cheap and side-effect-free — it may run in any chunk, in any
 * runtime, and is not re-run once the slot exists.
 *
 * For state that needs to be REPLACED later (rather than mutated in place),
 * store a holder object — `globalSlot('x', () => ({ value }))` — so every copy
 * reads through the same reference.
 */
export function globalSlot<T>(key: string, create: () => T): T {
  const symbol = Symbol.for(`${NAMESPACE}${key}`);
  const store = globalThis as unknown as Record<symbol, unknown>;
  if (!(symbol in store)) {
    store[symbol] = create();
  }
  return store[symbol] as T;
}

/** Keys already warned about, shared across chunks. */
function warnedKeys(): Set<string> {
  return globalSlot('warnings', () => new Set<string>());
}

/**
 * Emits `warn()` the first time `key` is seen in this process, and never again.
 *
 * Used for operational warnings that describe a persistent condition — a broken
 * introspection endpoint, a misconfigured poll interval. Repeating them on every
 * session read would flood the log; losing them entirely would hide an outage.
 * Returns true when it actually warned.
 */
export function warnOnce(key: string, warn: () => void): boolean {
  const keys = warnedKeys();
  if (keys.has(key)) return false;
  keys.add(key);
  warn();
  return true;
}

/**
 * Drops every slot, so the next access recreates it.
 *
 * FOR TESTS ONLY. Slots deliberately outlive module reloads — that is the whole
 * point — so a suite that reloads modules between cases (`vi.resetModules()`)
 * no longer gets a fresh discovery cache for free and must reset explicitly.
 *
 * @internal
 */
export function resetGlobalStateForTests(): void {
  const store = globalThis as unknown as Record<symbol, unknown>;
  for (const symbol of Object.getOwnPropertySymbols(store)) {
    if (Symbol.keyFor(symbol)?.startsWith(NAMESPACE)) {
      delete store[symbol];
    }
  }
}
