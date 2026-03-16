import type { ReactNode } from "react";
import { Route } from "next";
import { redirect } from "next/navigation";

import { sanitizePath } from "@/lib/sanitize";

/**
 * Home page: renders template title or redirects to IGRP_APP_HOME_SLUG.
 */
export default function Home(): ReactNode {
  const root = sanitizePath(
    process.env.NEXT_PUBLIC_IGRP_APP_HOME_SLUG || "/",
    "/",
  );

  if (root === "/") {
    return (
      <main id="main-content">
        <h3 className="text-3xl font-bold">IGRP NEXT.js Template</h3>
      </main>
    );
  }

  redirect(root as Route);
}
