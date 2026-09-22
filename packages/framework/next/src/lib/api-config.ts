import 'server-only';

// `node:` prefixed deliberately. A bare `async_hooks` specifier is resolvable
// as an npm package name — so it can be shadowed by anything that installs one
// — and Next's Edge runtime only exposes the builtin under the prefixed form.
// The prefix can ONLY ever mean the builtin.
import { AsyncLocalStorage } from 'node:async_hooks';

export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
};

const DEFAULT_TIMEOUT = 10_000;

/**
 * Fallback AM-client timeout, in ms.
 *
 * `apiManagementConfig.timeout` reaches the store only down the layout path,
 * which threads it explicitly into the data providers. A Server Action or Route
 * Handler runs in a fresh async context and never sees the config object at
 * all, so `igrpEnsureAccessClientConfig` has to rebuild the store from the
 * environment — it already does exactly this for `baseUrl` via
 * `IGRP_ACCESS_MANAGEMENT_API`. Without the matching variable the configured
 * timeout was silently the 10s default in every action, which is the same
 * "dead config" defect already fixed once on the read path (see the comment in
 * `layouts/igrp-layout-full.tsx`).
 *
 * Read per call, not at module scope: `process.env` is mutated per test and the
 * module is evaluated once.
 */
export function igrpResolveDefaultTimeout(
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = env.IGRP_ACCESS_MANAGEMENT_TIMEOUT;
  if (!raw) return DEFAULT_TIMEOUT;
  const parsed = Number(raw);
  // A malformed or nonsensical value falls back rather than producing an
  // AbortSignal that fires immediately (0) or never (NaN/negative).
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT;
}

// AsyncLocalStorage propagates context through async call chains in both RSC
// renders and Server Actions. React.cache only memoizes inside an active React
// render tree, which means it returns a fresh default object in Server Actions
// (which run as plain Node.js handlers outside any render context).
//
// enterWith() establishes a new store for the current async context and all
// async operations that originate from it — set once per request/action, read
// anywhere downstream in the same async chain.
const storage = new AsyncLocalStorage<IGRPClientRuntimeConfig>();

function getPerRequestConfig(): IGRPClientRuntimeConfig {
  return storage.getStore() ?? { token: '', baseUrl: '', timeout: igrpResolveDefaultTimeout() };
}

export function igrpSetAccessClientConfig(config: IGRPClientRuntimeConfig): void {
  const current = storage.getStore();
  if (current) {
    // Store already established in this async context — update in place.
    Object.assign(current, config);
  } else {
    // No store yet (e.g. first call in a Server Action or RSC render).
    // enterWith propagates to all downstream async calls in this context.
    storage.enterWith({ timeout: igrpResolveDefaultTimeout(), ...config });
  }
}

export function igrpGetAccessClientConfig(): IGRPClientRuntimeConfig {
  return getPerRequestConfig();
}

/**
 * Run `fn` with `config` applied, then restore whatever was in effect before.
 *
 * Use this instead of {@link igrpSetAccessClientConfig} whenever the config is
 * meant to apply to ONE call rather than to the rest of the request.
 *
 * Why it exists: `igrpSetAccessClientConfig` updates the store **in place**
 * (`Object.assign`) when one already exists, and that object belongs to the
 * async context that created it — typically the layout, for the whole request.
 * So a nested "set a different token for this one call" does not nest: it
 * overwrites the caller's token and every later call in the request silently
 * keeps using it. The same is true of `igrpResetAccessClientConfig`, which
 * blanks the enclosing context's token rather than its own.
 *
 * `AsyncLocalStorage#run` gives the callback its own store, so the write cannot
 * escape:
 *
 *   await igrpWithAccessClientConfig({ token: serviceToken, baseUrl }, () =>
 *     fetchSomethingAsTheService(),
 *   );
 *   // the user's token is still in effect here
 *
 * The store is a COPY, not a reference to the enclosing one — sharing the
 * object would reintroduce exactly the escape this avoids.
 */
export function igrpWithAccessClientConfig<T>(
  config: Partial<IGRPClientRuntimeConfig>,
  fn: () => T,
): T {
  const current = getPerRequestConfig();
  return storage.run({ ...current, ...config }, fn);
}

export function igrpResetAccessClientConfig(): void {
  const current = storage.getStore();
  if (current) {
    Object.assign(current, { token: '', baseUrl: '', timeout: igrpResolveDefaultTimeout() });
  }
}
