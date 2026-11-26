/**
 * Whether a GET of /logout may start the logout by itself. /logout is public,
 * so any site can navigate a signed-in user there; a request from outside the
 * app gets a confirm button instead.
 *
 * - `Sec-Fetch-Site: same-origin`: in-app link, router navigation, or the
 *   app's own `onSessionExpired` redirect during a soft navigation → `auto`.
 * - No header (plain-HTTP host, older browser): a same-origin Referer → `auto`.
 * - `none` (typed URL, bookmark), or no header and no Referer →
 *   `auto-if-session-dead`: the app's own `onSessionExpired` redirect on a
 *   document load. A web page cannot produce `none`, so this cannot be driven
 *   cross-site.
 * - `cross-site` / `same-site`, or a Referer from another host → `confirm`,
 *   even with a dead session: the logout still ends every co-hosted app
 *   session via `markHostLogout`.
 */
export type LogoutEntry = "auto" | "auto-if-session-dead" | "confirm";

export function classifyLogoutEntry(h: Headers): LogoutEntry {
  const site = h.get("sec-fetch-site");
  const referer = h.get("referer");

  if (site === "same-origin" || (!site && isFromThisHost(referer, h))) {
    return "auto";
  }
  if (site === "none" || (!site && !referer)) return "auto-if-session-dead";
  return "confirm";
}

function isFromThisHost(referer: string | null, h: Headers): boolean {
  if (!referer) return false;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  try {
    return host !== null && new URL(referer).host === host;
  } catch {
    return false;
  }
}
