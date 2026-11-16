"use client";

import { useState } from "react";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

/**
 * Mounts the logout page (whose mount effect runs the logout) straight away
 * when `autoStart`, otherwise only after the user confirms. `useState` keeps
 * the first value, so a re-render mid-logout never unmounts the page.
 */
export function LogoutConfirm({
  autoStart,
  children,
}: {
  autoStart: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("auth");
  const [confirmed, setConfirmed] = useState(autoStart);

  if (confirmed) return children;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <p className="text-foreground">{t("confirmSignOut")}</p>
      <IGRPButton onClick={() => setConfirmed(true)}>{t("signOut")}</IGRPButton>
    </div>
  );
}
