import type { ReactNode } from "react";
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
    return <div className="text-3xl font-bold">IGRP NEXT.js Template</div>;
  }

  redirect(root as Parameters<typeof redirect>[0]);
}
