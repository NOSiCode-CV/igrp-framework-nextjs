/**
 * `IGRPInputProps` unions `IGRPBaseAttributes` with `React.ComponentProps<"input">`,
 * so a component that forwards its rest props straight to the underlying element
 * hands the IGRP-only keys to the DOM. React lowercases them and renders them as
 * attributes (`iconname="User"`, `inputclassname="…"`), which is invalid HTML, and
 * it means the prop was never actually consumed.
 *
 * Components should destructure the IGRP keys they use and pass the remainder
 * through {@link igrpOmitNonDomProps}, which drops any that are left.
 */
const IGRP_ONLY_PROP_KEYS = [
  "label",
  "labelClassName",
  "helperText",
  "showIcon",
  "iconName",
  "iconSize",
  "iconPlacement",
  "iconClassName",
  "inputClassName",
  "error",
] as const

type IGRPOnlyPropKey = (typeof IGRP_ONLY_PROP_KEYS)[number]

const IGRP_ONLY_PROP_SET = new Set<string>(IGRP_ONLY_PROP_KEYS)

/** Strips IGRP-only props so the rest can be spread onto a DOM element. */
function igrpOmitNonDomProps<T extends object>(props: T): Omit<T, IGRPOnlyPropKey> {
  let hasIgrpKey = false
  for (const key of Object.keys(props)) {
    if (IGRP_ONLY_PROP_SET.has(key)) {
      hasIgrpKey = true
      break
    }
  }

  // The common case is nothing to strip; returning the same object keeps prop
  // identity stable for the React Compiler and for any memoized child.
  if (!hasIgrpKey) return props as Omit<T, IGRPOnlyPropKey>

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!IGRP_ONLY_PROP_SET.has(key)) result[key] = value
  }
  return result as Omit<T, IGRPOnlyPropKey>
}

export { igrpOmitNonDomProps, IGRP_ONLY_PROP_KEYS, type IGRPOnlyPropKey }
