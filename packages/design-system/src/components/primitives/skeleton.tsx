/* shadcn: 2026-09-15 */

import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  // IGRP: a placeholder box has nothing to read; the loading region carries aria-busy.
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
