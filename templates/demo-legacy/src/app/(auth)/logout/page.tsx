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

// Cap on the IdP end-session URL lookup (which does an OIDC discovery
// round-trip). Bounding it is what lets the mandatory local signOut() run
// unconditionally: a slow/hanging IdP can only cost us the OPTIONAL IdP
// redirect, never the local teardown.
// TRADE-OFF: if your IdP's discovery latency routinely exceeds this, every
// logout degrades to local-only (the IdP SSO session then persists). Tune to
// sit just above real-world discovery latency.
const LOOKUP_TIMEOUT_MS = 3000;

// Last-resort watchdog. Only fires if signOut() ITSELF hangs — the lookup
// above is already bounded by LOOKUP_TIMEOUT_MS, so it can no longer stall the
// effect this long. MUST be greater than LOOKUP_TIMEOUT_MS.
const FALLBACK_TIMEOUT_MS = 8000;

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
      //
      // INVARIANT: every exit path below MUST end in hardNavigate. Because
      // `logoutStarted` is never reset, a full-page reload is the only thing
      // that re-arms this page — a soft-nav (or early return without navigating)
      // exit would wedge it un-loggable-out for the rest of the SPA lifetime.
      window.location.replace(url);
    };

    // Last-resort watchdog for a hung signOut(). The IdP end-session lookup is
    // already bounded by LOOKUP_TIMEOUT_MS below, so it can no longer stall the
    // effect this long — the only thing that can is signOut() itself.
    //
    // Deliberately NOT cleared on unmount. The `logoutStarted` module guard
    // makes the effect body run exactly ONCE per module lifetime, so a remount
    // during the logout window (React Strict Mode's mount→unmount→mount in dev,
    // or `IGRPSessionWatcher` re-rendering the subtree on a session refetch)
    // cannot re-arm this timer. If the unmount cleanup cleared it, that remount
    // would strip away the only safety net and — should signOut() stall — leave
    // the page rendering the spinner forever. The `settled` flag already
    // prevents a double navigation, so a surviving timer that fires after a
    // successful navigate is a harmless no-op (the page has already
    // hard-navigated away).
    const fallbackTimeout = setTimeout(
      () => hardNavigate(buildLoginUrl()),
      FALLBACK_TIMEOUT_MS,
    );

    (async () => {
      // Best-effort: fetch the end-session URL BEFORE clearing the local
      // session — the token needed to build the id_token_hint parameter is
      // gone after signOut(). A failure OR a hang here must NOT block the local
      // signOut below; otherwise a flaky/hanging IdP discovery round-trip would
      // strand the user still authenticated (session cookie intact) even though
      // we navigate them to /login.
      //
      // The lookup is raced against LOOKUP_TIMEOUT_MS so a hung IdP can only
      // cost us the (optional) IdP redirect — never the (mandatory) local
      // teardown. This is what makes signOut() below unconditional: the outer
      // fallbackTimeout is now a true last resort (covers a hung signOut
      // itself) rather than something that can pre-empt signOut while this
      // lookup is still pending. Worst case on timeout/failure: we skip the IdP
      // redirect and its SSO session lingers, but the local session is still
      // torn down.
      let endSessionUrl: string | null = null;
      let lookupTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        endSessionUrl = await Promise.race([
          getLogoutUrl(buildLoginUrl()),
          new Promise<null>((resolve) => {
            lookupTimer = setTimeout(() => resolve(null), LOOKUP_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        reportError(error, { segment: "(auth)/logout" });
      } finally {
        // Clear the race timer if getLogoutUrl won — otherwise it lingers and
        // fires later to resolve an already-settled promise (a harmless no-op,
        // but a needless dangling timer).
        clearTimeout(lookupTimer);
      }

      // The one step that must never be skipped: clear the local NextAuth
      // session. Isolated in its own try so a rejection still falls through to
      // the navigation below rather than leaving the spinner up forever.
      try {
        await signOut({ redirect: false });
      } catch (error) {
        reportError(error, { segment: "(auth)/logout" });
      }

      clearTimeout(fallbackTimeout);
      if (settled) return;

      if (endSessionUrl) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[logout] navigating to end-session URL", endSessionUrl);
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
    })();
  }, []);

  return (
    <IGRPTemplateLoading
      text="A terminar sessão..."
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
