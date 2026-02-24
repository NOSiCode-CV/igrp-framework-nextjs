import "@/styles/globals.css";

import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";

import type { Metadata, Viewport } from "next";

import { configLayout } from "@/actions/igrp/layout";
import { createConfig } from "@/igrp.template.config";
import { setupEnvironment } from "@/lib/env-setup";

export const metadata: Metadata = {
  title: "IGRP | Centro de Aplicações",
  description: "IGRP | Centro de Aplicações",
  icons: { icon: "/igrp/logo-no-text.png" },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactNode> {
  setupEnvironment();

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig);

  const { IGRPRootLayout } = await import("@igrp/framework-next");

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
