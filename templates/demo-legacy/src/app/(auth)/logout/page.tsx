"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";
import { useEffect } from "react";

import { getLogoutUrl } from "@/actions/igrp/auth";
import { reportError } from "@/lib/report-error";

// Module-scoped guard so a remount of this page (e.g. provider re-renders that
// briefly null out the subtree) cannot kick off a SECOND signOut. A `useRef`
// is component-instance scoped and gets re-created on remount, which is how
// the previous guard let two `POST /api/auth/signout` calls slip through in
// dev.
let logoutStarted = false;

function buildLoginUrl(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${basePath}/login`;
}

export default function LogoutPage() {
  useEffect(() => {
    if (logoutStarted) return;
    logoutStarted = true;

    let settled = false;
    const hardNavigate = (url: string) => {
      if (settled) return;
      settled = true;
      // Hard navigation rather than `router.replace`: logout must tear down
      // every client cache/provider that still holds the now-dead session.
      window.location.replace(url);
    };

    // Hard fallback: only meant for the case where getLogoutUrl + signOut
    // never resolve (IdP revoke/end-session round-trip hangs). Generous so it
    // does NOT pre-empt a slow-but-successful single-logout.
    const fallbackTimeout = setTimeout(() => hardNavigate(buildLoginUrl()), 8000);

    (async () => {
      try {
        // Fetch end-session URL BEFORE clearing local session — token is
        // required to build the id_token_hint parameter and is gone after
        // signOut().
        const endSessionUrl = await getLogoutUrl(buildLoginUrl());

        await signOut({ redirect: false });

        clearTimeout(fallbackTimeout);
        if (settled) return;

        if (endSessionUrl) {
          if (process.env.NODE_ENV !== "production") {
            console.debug(
              "[logout] navigating to end-session URL",
              endSessionUrl,
            );
          }
          hardNavigate(endSessionUrl);
        } else {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[logout] no end-session URL — IdP SSO session may persist; falling back to /login",
            );
          }
          hardNavigate(buildLoginUrl());
        }
      } catch (error) {
        reportError(error, { segment: "(auth)/logout" });
        clearTimeout(fallbackTimeout);
        hardNavigate(buildLoginUrl());
      }
    })();

    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, []);

  return (
    <IGRPTemplateLoading
      text="A terminar sessão..."
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
