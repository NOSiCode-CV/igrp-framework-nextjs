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

    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    (async () => {
      try {
        // Fetch end-session URL before clearing local session — token is required
        // to build the id_token_hint parameter and is gone after signOut().
        const endSessionUrl = await getLogoutUrl(
          `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`,
        );

        await signOut({ redirect: false });

        clearTimeout(timeout);

        if (endSessionUrl) {
          // Redirect browser to IdP end-session endpoint so the SSO session
          // is also terminated. The IdP redirects back to /login when done.
          window.location.replace(endSessionUrl);
        } else {
          router.replace("/login");
        }
      } catch (error) {
        reportError(error, { segment: "(auth)/logout" });
        clearTimeout(timeout);
        router.replace("/login");
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
