import { isValid, parse } from "date-fns"

/**
 * Numeric date tokens a typed date input can mask and parse on its own.
 *
 * Anything outside this set (`MMM`, `EEEE`, `P`, …) renders text that cannot be reconstructed
 * from digits, so a format containing one falls back to plain `date-fns` parsing with no mask.
 */
const NUMERIC_TOKEN_RE = /^(d{1,2}|M{1,2}|y{2}|y{4})$/

/** @internal A parsed piece of a date format: either a numeric token or a literal separator. */
type DateFormatPart = { kind: "token"; length: number } | { kind: "literal"; text: string }

/**
 * Splits a date format into numeric tokens and the literals between them.
 *
 * Returns `undefined` when the format uses a token this module cannot mask, which is the
 * signal for callers to fall back to unmasked parsing.
 */
export function getDateFormatParts(dateFormat: string): DateFormatPart[] | undefined {
  const parts: DateFormatPart[] = []
  const chunks = dateFormat.match(/([a-zA-Z])\1*|[^a-zA-Z]+/g)

  if (!chunks) return undefined

  for (const chunk of chunks) {
    if (!/[a-zA-Z]/.test(chunk)) {
      parts.push({ kind: "literal", text: chunk })
      continue
    }
    if (!NUMERIC_TOKEN_RE.test(chunk)) return undefined
    // `d` and `M` accept one or two digits when parsed, but a mask has to commit to a width;
    // two is the width a user types and the width `dd`/`MM` render, so both map to two.
    parts.push({ kind: "token", length: chunk.startsWith("y") ? chunk.length : 2 })
  }

  const tokenCount = parts.filter((part) => part.kind === "token").length
  return tokenCount >= 2 ? parts : undefined
}

/**
 * Rewrites raw keystrokes into `dateFormat`'s shape as the user types.
 *
 * Digits fill the current token and overflow into the next one, so `26082026` becomes
 * `26-08-2026`. Typing any separator closes the current token early and zero-pads it, so the
 * natural `1-8-2026` becomes `01-08-2026` too. Separators are only inserted *between* filled
 * tokens — never appended to the end — because a trailing separator would reappear on every
 * keystroke and make backspace impossible.
 */
export function maskDateInput(rawValue: string, dateFormat: string): string {
  const parts = getDateFormatParts(dateFormat)
  if (!parts) return rawValue

  const tokens = parts.filter((part): part is { kind: "token"; length: number } => part.kind === "token")
  const values: string[] = []
  let index = 0
  let buffer = ""

  for (const char of rawValue) {
    if (index >= tokens.length) break

    if (char >= "0" && char <= "9") {
      buffer += char
      if (buffer.length === tokens[index]!.length) {
        values[index] = buffer
        index += 1
        buffer = ""
      }
      continue
    }

    if (buffer.length > 0) {
      values[index] = buffer.padStart(tokens[index]!.length, "0")
      index += 1
      buffer = ""
    }
  }

  if (buffer.length > 0 && index < tokens.length) {
    values[index] = buffer
  }

  let masked = ""
  let tokenIndex = 0

  for (const part of parts) {
    if (part.kind === "literal") {
      // Only bridge two tokens that both carry digits; never trail off the end.
      if (tokenIndex > 0 && tokenIndex < values.length && values[tokenIndex] !== undefined) {
        masked += part.text
      }
      continue
    }
    if (values[tokenIndex] === undefined) break
    masked += values[tokenIndex]
    tokenIndex += 1
  }

  return masked
}

/** The maximum number of characters a fully typed `dateFormat` can occupy. */
export function getDateFormatMaxLength(dateFormat: string): number | undefined {
  const parts = getDateFormatParts(dateFormat)
  if (!parts) return undefined
  return parts.reduce((total, part) => total + (part.kind === "token" ? part.length : part.text.length), 0)
}

/**
 * Parses typed text against `dateFormat`, tolerating the widths a person actually types.
 *
 * `date-fns` already accepts `1-8-2026` for `dd-MM-yyyy`; what it will not do is tell a
 * half-typed string from a wrong one. Every token must therefore be present and non-empty
 * before the string is parsed, so `26-08-20` is rejected as incomplete rather than read as
 * the year 20. Impossible calendar days (`31-02-2026`) are rejected by `date-fns` itself.
 */
export function parseDateInput(value: string, dateFormat: string): Date | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const parts = getDateFormatParts(dateFormat)

  if (!parts) {
    // Unmaskable format (`dd MMM yyyy` and friends): only an exact-width string can be trusted.
    if (trimmed.length !== dateFormat.length) return undefined
    const parsed = parse(trimmed, dateFormat, new Date())
    return isValid(parsed) ? parsed : undefined
  }

  const tokens = parts.filter((part) => part.kind === "token")
  const segments = trimmed.split(/[^0-9]+/).filter((segment) => segment.length > 0)

  if (segments.length !== tokens.length) return undefined

  const complete = segments.every((segment, i) => {
    const { length } = tokens[i] as { length: number }
    // Years must be typed in full — `20` for `yyyy` is a half-typed `2026`, not the year 20.
    return length === 2 ? segment.length <= 2 : segment.length === length
  })

  if (!complete) return undefined

  const parsed = parse(trimmed, dateFormat, new Date())
  return isValid(parsed) ? parsed : undefined
}
