import { IGRPLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { configLayout } from "@/actions/igrp/layout";

export default async function IGRPRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  // IF YOU USE AN AUTHENTICATION STRATEGY, UNCOMMENT THIS BLOCK

  const { layout, previewMode } = config;
  const { session } = layout || {};

  // Check preview mode directly from environment variable as well (handle whitespace, case, and quotes)
  const rawValue = process.env.IGRP_PREVIEW_MODE;
  const previewModeValue = rawValue
    ?.trim()
    ?.replace(/^["']|["']$/g, "")
    ?.toLowerCase();
  const envPreviewMode = previewModeValue === "true";
  const isPreviewMode = envPreviewMode || previewMode;

  const headersList = await headers();
  const currentPath =
    headersList.get("x-pathname") ||
    headersList.get("x-next-url") ||
    headersList.get("referer") ||
    "";

  const baseUrl =
    process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL || "/";

  const urlLogin = "/login";

  const loginPath = new URL(urlLogin || "/", baseUrl).pathname;

  const isAlreadyOnLogin = currentPath.startsWith(loginPath);

  if (!isPreviewMode && session === null && urlLogin && !isAlreadyOnLogin) {
    redirect(urlLogin);
  }

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
