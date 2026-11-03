import type { VariantProps } from "class-variance-authority"

import type { buttonVariants } from "../components/primitives/button.js"

/** True for the `icon*` sizes, which render an icon with no text. */
export function isIconOnlySize(size: VariantProps<typeof buttonVariants>["size"]): boolean {
  return typeof size === "string" && size.startsWith("icon")
}
