"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getLogoutUrl } from "@/actions/igrp/auth";
import { reportError } from "@/lib/report-error";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Fetch end-session URL before clearing local session — token is required
        // to build the id_token_hint parameter and is gone after signOut().
        const endSessionUrl = await getLogoutUrl(
          `${window.location.origin}/login`,
        );

        await signOut({ redirect: false });

        if (!cancelled) {
          if (endSessionUrl) {
            // Redirect browser to IdP end-session endpoint so the SSO session
            // is also terminated. The IdP redirects back to /login when done.
            window.location.replace(endSessionUrl);
          } else {
            router.replace("/login");
          }
        }
      } catch (error) {
        reportError(error, { segment: "(auth)/logout" });
        if (!cancelled) router.replace("/login");
      }
    })();

    // Absolute-worst-case fallback: if the async chain above hangs for any
    // reason, still leave the page after 3 seconds.
    const timeout = setTimeout(() => {
      if (!cancelled) router.replace("/login");
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router]);

  // TODO: apply design
  return <div>Logout in progress</div>;
}
