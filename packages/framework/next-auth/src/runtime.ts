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
 * Next tags every one of these with a string `digest`; a genuine failure
 * (cookie decode, JSON parse, network error) does not have one.
 */
export function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if (typeof (error as { digest?: unknown }).digest === 'string') return true;
  const name = (error as { name?: unknown }).name;
  return name === 'DynamicServerError' || name === 'StaticGenBailoutError';
}
