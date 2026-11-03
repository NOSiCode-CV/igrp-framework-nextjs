import type { VariantProps } from "class-variance-authority"

import type { buttonVariants } from "../components/primitives/button.js"

/** True for the `icon*` sizes, which render an icon with no text. */
export function isIconOnlySize(size: VariantProps<typeof buttonVariants>["size"]): boolean {
  return typeof size === "string" && size.startsWith("icon")
}

/**
 * Spinner ships a literal `size-4`, which defeats the button primitive's
 * `[&_svg:not([class*='size-'])]` guard — mirror the primitive's size overrides for it.
 */
export function igrpSpinnerSizeClassName(size: VariantProps<typeof buttonVariants>["size"]): string | undefined {
  return size === "xs" || size === "icon-xs" ? "size-3" : size === "sm" ? "size-3.5" : undefined
}
