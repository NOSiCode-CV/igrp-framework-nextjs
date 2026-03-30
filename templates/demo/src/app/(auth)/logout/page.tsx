"use client";

import { useEffect } from "react";
import { signOut } from "@igrp/framework-next-auth/client";

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      await signOut({ redirect: false });
    })();
  }, []);

  return (
    <main id="main-content" aria-live="polite" aria-busy="true">
      <h1 className="sr-only">Logout</h1>
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-muted-foreground">A terminar sessão…</p>
      </div>
    </main>
  );
}
