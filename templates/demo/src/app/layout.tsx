import "@/styles/globals.css";

import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";

import type { Metadata, Viewport } from "next";

import { getConfig } from "@/igrp.template.config";
import { siteConfig } from "@/config/site";
import { setupEnvironment } from "@/lib/env-setup";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || siteConfig.url),
  title: "IGRP | Centro de Aplicações",
  description: "IGRP | Centro de Aplicações",
  icons: { icon: "/igrp/logo-no-text.png" },
  openGraph: {
    title: "IGRP | Centro de Aplicações",
    description: "IGRP | Centro de Aplicações",
    images: siteConfig.ogImage,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

/**
 * Root layout: env setup, config, and IGRP framework wrapper.
 *
 * @param props - Layout props with children
 * @returns IGRPRootLayout wrapping children
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactNode> {
  setupEnvironment();

  const [config, { IGRPRootLayout }] = await Promise.all([
    getConfig(),
    import("@igrp/framework-next"),
  ]);

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
