import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";

import { getConfig } from "@/igrp.template.config";
import { getLoginPath } from "@igrp/framework-next-auth/sanitize";
import { isPreviewMode } from "@/lib/utils";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactNode> {
  const [config, headersList, { IGRPLayout }] = await Promise.all([
    getConfig(),
    headers(),
    import("@igrp/framework-next"),
  ]);

  const { layout } = config;
  const { session } = layout || {};
  const currentPath =
    headersList.get("x-pathname") ||
    headersList.get("x-next-url") ||
    headersList.get("referer") ||
    "";

  const baseUrl =
    process.env.NEXTAUTH_URL_INTERNAL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  const urlLogin = "/login";
  const loginPath = getLoginPath(baseUrl, urlLogin);
  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!isPreviewMode() && session === null && urlLogin && !isAlreadyOnLogin) {
    redirect(urlLogin);
  }

  after(async () => {
    // Non-blocking: runs after response is sent. Add analytics, logging, etc.
    // await logPageView(currentPath);
  });

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
