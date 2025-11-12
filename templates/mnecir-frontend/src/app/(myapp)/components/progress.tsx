"use client";

import * as React from "react";

import { Progress as ProgressComponent } from "@igrp/igrp-framework-react-design-system/dist/components/primitives/progress";

export function Progress() {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return <ProgressComponent value={progress} className="w-[60%]" />;
}
