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
