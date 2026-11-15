/**
 * Next.js runtime signals that must never be swallowed.
 *
 * Pure and dependency-free so it is safe in Edge, Node and the browser, and so
 * downstream packages can share it instead of re-deriving it.
 */

/**
 * True for Next.js **control-flow** signals, which are thrown rather than
 * returned: the static-render bailout (`cookies()` / `headers()` read during
 * prerender, digest `DYNAMIC_SERVER_USAGE`), `redirect()`, `notFound()`,
 * `forbidden()`, and the client-side-rendering bailout.
 *
 * A `try/catch` around anything that touches request state MUST re-throw
 * these. Catching the prerender bailout masks it as "no session", so Next never
 * marks the route dynamic and the page renders — and can be cached — as logged
 * out. Catching a `redirect()` silently cancels the navigation.
 *
 * Next tags these with a `digest` that starts with one of its own codes. Only
 * those count: application errors carry digests too (framework-next's
 * `AppError` sets `<id>|<message>`), and re-throwing one from a `callbacks.jwt`
 * extension would make next-auth clear the session.
 */
// Codes from next/dist/client/components/* and next/dist/server (Next 15.5).
// NEXT_NOT_FOUND is the pre-15 notFound() digest.
const NEXT_DIGEST_PREFIXES = [
  'NEXT_REDIRECT',
  'NEXT_HTTP_ERROR_FALLBACK',
  'NEXT_NOT_FOUND',
  'DYNAMIC_SERVER_USAGE',
  'BAILOUT_TO_CLIENT_SIDE_RENDERING',
  'HANGING_PROMISE_REJECTION',
  'NEXT_PRERENDER_INTERRUPTED',
];

export function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest === 'string' && NEXT_DIGEST_PREFIXES.some((p) => digest.startsWith(p))) {
    return true;
  }
  // Next 15 tags the static-generation bailout by `code`; older versions by `name`.
  if ((error as { code?: unknown }).code === 'NEXT_STATIC_GEN_BAILOUT') return true;
  const name = (error as { name?: unknown }).name;
  return name === 'DynamicServerError' || name === 'StaticGenBailoutError';
}
