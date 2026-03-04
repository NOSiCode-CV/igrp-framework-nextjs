import { createConfig } from "@igrp/template-config";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { configLayout } from "@/actions/igrp/layout";
import { setupEnvironment } from "@/lib/env-setup";
import { logger } from "@/lib/errors";
import { isPreviewMode } from "@/lib/utils";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactNode> {
  setupEnvironment();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  const { layout } = config;
  const { session } = layout || {};

  const headersList = await headers();
  const currentPath =
    headersList.get("x-pathname") ||
    headersList.get("x-next-url") ||
    headersList.get("referer") ||
    "";

  const baseUrl = process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL;

  const urlLogin = "/login";

  const resolvedBaseUrl = baseUrl || "http://localhost:3000";
  let loginPath: string;
  try {
    loginPath = new URL(urlLogin || "/", resolvedBaseUrl).pathname;
  } catch (error) {
    logger.error("[Layout] Invalid URL construction", error, {
      baseUrl: resolvedBaseUrl,
      urlLogin,
    });
    loginPath = "/login";
  }

  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!isPreviewMode() && session === null && urlLogin && !isAlreadyOnLogin) {
    redirect(urlLogin);
  }

  const { IGRPLayout } = await import("@igrp/framework-next");
  const { IGRPTemplateLoading } = await import("@igrp/framework-next-ui");

  return (
    <IGRPLayout config={config}>
      <Suspense
        fallback={
          <IGRPTemplateLoading appCode={process.env.IGRP_APP_CODE || ""} />
        }
      >
        {children}
      </Suspense>
    </IGRPLayout>
  );
}
