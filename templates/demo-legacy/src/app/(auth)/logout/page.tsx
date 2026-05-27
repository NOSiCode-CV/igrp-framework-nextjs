"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { getLogoutUrl } from "@/actions/igrp/auth";
import { reportError } from "@/lib/report-error";

export default function LogoutPage() {
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode double-invoking this effect in dev.
    // Logout must run exactly once: getLogoutUrl reads the token cookie, then
    // signOut clears it — a second run finds no token and skips the IdP redirect.
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Single source of truth for "navigation already happened". The hard
    // fallback below and the success path both check it so a slow-but-eventually
    // successful logout can't fire a second navigation that clobbers the first.
    let settled = false;
    const goLogin = () => {
      if (settled) return;
      settled = true;
      router.replace("/login");
    };

    // Hard fallback: only meant for the case where getLogoutUrl + signOut never
    // resolve (e.g. the IdP revoke/end-session round-trip hangs). Kept generous
    // so it does NOT pre-empt a normal slow single-logout — we want to reach the
    // IdP end-session endpoint, not bounce straight to /login.
    const timeout = setTimeout(goLogin, 8000);

    (async () => {
      try {
        // Fetch end-session URL before clearing local session — token is required
        // to build the id_token_hint parameter and is gone after signOut().
        const endSessionUrl = await getLogoutUrl(
          `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`,
        );

        await signOut({ redirect: false });

        // Fallback already navigated to /login — don't navigate again.
        if (settled) return;
        clearTimeout(timeout);
        settled = true;

        if (endSessionUrl) {
          // D4 — log the URL we're about to navigate to. Lets us copy-paste
          // it into a fresh tab to test the IdP's logout behavior in isolation.
          if (process.env.NODE_ENV !== "production") {
            console.debug(
              "[logout] navigating to end-session URL",
              endSessionUrl,
            );
          }
          // Redirect browser to IdP end-session endpoint so the SSO session
          // is also terminated. The IdP redirects back to /login when done.
          window.location.replace(endSessionUrl);
        } else {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[logout] no end-session URL — IdP SSO session may persist; falling back to /login",
            );
          }
          router.replace("/login");
        }
      } catch (error) {
        reportError(error, { segment: "(auth)/logout" });
        clearTimeout(timeout);
        goLogin();
      }
    })();

    return () => {
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <IGRPTemplateLoading
      text="A terminar sessão..."
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
