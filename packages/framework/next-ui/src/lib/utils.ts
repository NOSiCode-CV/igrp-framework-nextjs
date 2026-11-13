export function getLocationOriginURL() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/**
 * The app's configured `basePath`, baked into the client bundle by Next.js at
 * build time. Read through these helpers rather than inline, so there is one
 * place to change if the variable is ever renamed.
 */
function basePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? '';
}

/**
 * Prefixes `basePath` onto an app-absolute asset path.
 *
 * Only for URLs handed to `next/image` and raw `<img>`: `next/link` and
 * `router.push()` apply `basePath` themselves, so passing an already-prefixed
 * path to those double-prefixes it.
 *
 * Left untouched: protocol-relative and absolute URLs (`//host/x`,
 * `https://host/x`), anything not starting with `/`, and paths already carrying
 * the prefix — so it is safe to apply twice.
 */
export function withBasePath(src: string): string {
  const base = basePath();
  if (!base || !src.startsWith('/') || src.startsWith('//') || src.startsWith(`${base}/`)) {
    return src;
  }
  return `${base}${src}`;
}
