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
      try { await signOut({ redirect: false }); }
      catch (error) { reportError(error, { segment: "(auth)/logout" }); }
      finally { if (!cancelled) router.replace("/"); }
    })();
    const timeout = setTimeout(() => { if (!cancelled) router.replace("/"); }, 3000);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [router]);
  return <div>Logout in progress</div>;
}
