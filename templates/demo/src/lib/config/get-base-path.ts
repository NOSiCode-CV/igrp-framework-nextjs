/**
 * Normalizes base path and returns the API auth path.
 *
 * @param bp - Base path (e.g. "" or "/my-app")
 * @returns Normalized path ending with /api/auth
 */
export function getBasePath(bp: string) {
  if (!bp) return "/api/auth";

  const normalized = bp.startsWith("/") ? bp : `/${bp}`;
  const cleanPath = normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
  return `${cleanPath}/api/auth`;
}
