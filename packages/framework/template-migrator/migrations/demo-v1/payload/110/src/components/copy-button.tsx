"use client";

import { useEffect, useState } from "react";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";

type CopyState = "idle" | "copied" | "failed";

const COPY_ICON: Record<CopyState, string> = {
  idle: "Copy",
  copied: "Check",
  failed: "CircleAlert",
};

/**
 * Copies a literal value. The label confirms the copy — or, when the browser
 * refuses clipboard access, says to copy by hand — for two seconds. The labels
 * come from the server, so the `home` messages never ship to the browser.
 */
export function CopyButton({
  value,
  labels,
}: {
  value: string;
  labels: Record<CopyState, string>;
}) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <IGRPButton
      type="button"
      variant="outline"
      size="sm"
      iconName={COPY_ICON[state]}
      aria-live="polite"
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => setState("copied"))
          .catch(() => setState("failed"));
      }}
    >
      {labels[state]}
    </IGRPButton>
  );
}
