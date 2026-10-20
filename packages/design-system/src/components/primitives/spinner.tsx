/* shadcn: 2026-09-15 */
"use client"

import { cn } from "cn"
import { Loader2Icon } from "lucide-react"

import { useIGRPi18n } from "../../i18n/context.js"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const i18n = useIGRPi18n()
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label={i18n.loadingSpinner.label}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
