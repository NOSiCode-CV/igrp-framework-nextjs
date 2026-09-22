import { cva } from "class-variance-authority"
import type { IGRPIconName } from "../components/horizon/icon/index.js"
import type { IGRPColorVariants } from "./colors.js"

/** Parses "yyyy-mm-dd" or "y-m-d" string to local Date. Throws on invalid input. */
export function parseLocalDate(dateStr: string): Date {
  const [yStr, mStr, dStr] = dateStr.split("-")
  const y = Number(yStr)
  const m = Number(mStr)
  const d = Number(dStr)
  if ([y, m, d].some((part) => Number.isNaN(part) || part === undefined || part === null)) {
    throw new Error(`Invalid date string: ${dateStr}`)
  }
  return new Date(y, m - 1, d)
}

/** Returns true if the URL points to a different origin than the current page. */
export function igrpIsExternalUrl(url?: string): boolean {
  if (!url) return false

  try {
    const urlObj = new URL(url, window.location.origin)
    return urlObj.origin !== window.location.origin
  } catch {
    return false
  }
}

/** Ensures URL has leading slash or full protocol. Relative paths get / prefix. */
export function igrpNormalizeUrl(url: string): string {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  if (url.startsWith("/")) return url
  return `/${url}`
}


/**
 * Remove all non-alphabetic characters from the input string.
 * This will remove all spaces, numbers, and special characters, leaving only letters.
 *
 * @param {string} input The string to clean.
 * @returns {string} The cleaned string.
 */
export function igrpCleanString(input: string | null | undefined): string {
  if (!input) return ""
  return input.replace(/[^a-zA-Z]/g, "") as string
}

/** CVA variants for border radius (none, sm, md, lg, xl, 2xl, 3xl, 4xl, full). */
export const igrpRounded = cva("", {
  variants: {
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
      "4xl": "rounded-4xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    rounded: "md",
  },
})

/** Converts a string to PascalCase (e.g. "hello world" → "HelloWorld"). */
export function igrpToPascalCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")
}

/**
 * Extracts initials from a name (e.g. "John Doe" → "JD").
 * Single word returns first letter. Empty returns "N/A".
 */
export function igrpGetInitials(value: string): string {
  if (!value) return "N/A"
  const parts = value.trim().split(" ").filter(Boolean)
  if (parts.length === 0) return "N/A"

  const firstPart = parts[0]!
  if (parts.length === 1) return firstPart.charAt(0).toUpperCase()

  const lastPart = parts[parts.length - 1]!
  const first = firstPart.charAt(0)
  const last = lastPart.charAt(0)
  return `${first}${last}`.toUpperCase()
}


/** Tailwind grid span classes by layout size. */
export const igrpGridSizeClasses = {
  default: "",
  full: "col-span-full",
  "1/2": "col-span-full md:col-span-2",
  "1/3": "col-span-full md:col-span-4",
  "2/3": "col-span-full md:col-span-8",
  "1/4": "col-span-full md:col-span-3",
  "3/4": "col-span-full md:col-span-9",
}

/** Icon name per color variant for alerts. */
export const igrpAlertIconMappings: Record<IGRPColorVariants, IGRPIconName> = {
  primary: "Info",
  secondary: "Star",
  success: "CircleCheck",
  destructive: "CircleAlert",
  warning: "TriangleAlert",
  info: "Info",
  indigo: "Sparkles",
}

/** Tailwind classes to hide native time input picker indicator. */
export const DEFAULT_HIDE_TIME_INDICATOR =
  "appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"

/** date-fns format string for dd-MM-yyyy. */
export const DD_MM_YYYY = "dd-MM-yyyy"





