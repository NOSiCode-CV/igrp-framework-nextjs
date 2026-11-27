import type { Metadata } from "next";
import { headers } from "next/headers";

import { getTranslations } from "next-intl/server";

import { auth, serverSession } from "@/lib/auth";
import { classifyLogoutEntry } from "@/lib/logout-entry";

import { LogoutConfirm } from "./logout-confirm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth"))("signOut") };
}

/**
 * /logout is a public GET, so any site can navigate a signed-in user here.
 * The logout only starts by itself when the request came from this app; any
 * other entry gets a confirm button that runs the same logout. The rules are
 * in `classifyLogoutEntry` (`@/lib/logout-entry`).
 *
 * The wrapper is always rendered so the page does not remount when
 * `markHostLogout`'s cookie write re-renders this route mid-logout.
 */
export default async function LogoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const entry = classifyLogoutEntry(await headers());

  let autoStart = entry === "auto";
  if (entry === "auto-if-session-dead") {
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
