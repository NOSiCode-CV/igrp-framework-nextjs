"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { reportError } from "@/lib/report-error";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await signOut({ redirect: false });
      } catch (error) {
        // `signOut` can fail when auth is disabled (stub handler returns 404)
        // or when the session cookie is already gone. Log and continue —
        // the fallback redirect below still fires so the user isn't stuck.
        reportError(error, { segment: "(auth)/logout" });
      } finally {
        if (!cancelled) router.replace("/");
      }
    })();

    // Absolute-worst-case fallback: if the async chain above hangs for any
    // reason, still leave the page after 3 seconds.
    const timeout = setTimeout(() => {
      if (!cancelled) router.replace("/");
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router]);

  // TODO: apply design
  return <div>Logout in progress</div>;
}
