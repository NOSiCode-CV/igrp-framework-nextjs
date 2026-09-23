import { icons } from "lucide-react"

/**
 * lucide's full catalogue — every icon's component, keyed by PascalCase name.
 *
 * Importing this loads the code for all ~1,700 icons (and, next to the lazily
 * loaded `IGRPIcon`, one chunk per icon), so it lives in its own module: only
 * code that genuinely needs the components pays for it. If you only need the
 * names, use `IGRPIconObject`, which is data.
 */
const IGRPIconList = icons

export { IGRPIconList }
