import "@/styles/globals.css";

import { IGRPRootLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";

import type { Metadata, Viewport } from "next";

import { configLayout } from "@/actions/igrp/layout";
import { createConfig } from "@/igrp.template.config";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "IGRP | Template Aplicações",
  description: "IGRP | Template Aplicações",
  icons: { icon: `${basePath}/logo-no-text.png` },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
