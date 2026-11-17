import type { Metadata } from "next";
import { headers } from "next/headers";

import { getTranslations } from "next-intl/server";

import { auth, serverSession } from "@/lib/auth";

import { LogoutConfirm } from "./logout-confirm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth"))("signOut") };
}

/**
 * /logout is a public GET, so any site can navigate a signed-in user here.
 * The logout only starts by itself when the request came from this app; any
 * other entry gets a confirm button that runs the same logout.
 *
 * - `Sec-Fetch-Site: same-origin`: in-app link, router navigation, or the
 *   app's own `onSessionExpired` redirect during a soft navigation.
 * - No header (plain-HTTP host, older browser): fall back to a same-origin
 *   Referer.
 * - `none` (typed URL, bookmark), or no header and no Referer: auto-start only
 *   when the session is already dead, which is the app's own
 *   `onSessionExpired` redirect on a document load. A web page cannot produce
 *   `none`, so this cannot be driven cross-site.
 * - `cross-site` / `same-site`: always confirm, even with a dead session —
 *   the logout still ends every co-hosted app session via `markHostLogout`.
 *
 * The wrapper is always rendered so the page does not remount when
 * `markHostLogout`'s cookie write re-renders this route mid-logout.
 */
export default async function LogoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const site = h.get("sec-fetch-site");
  const referer = h.get("referer");

  let autoStart =
    site === "same-origin" || (!site && isFromThisHost(referer, h));

  if (!autoStart && (site === "none" || (!site && !referer))) {
    const session = await serverSession();
    autoStart =
      session !== null &&
      auth.isTokenExpiredOrFailed({
        expiresAt: session.expiresAt,
        error: session.error,
      });
  }

  return <LogoutConfirm autoStart={autoStart}>{children}</LogoutConfirm>;
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
