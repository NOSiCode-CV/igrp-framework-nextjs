import { format, isValid, parse } from "date-fns"

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
      // Day and month are zero-padded when a separator closes them early, so the natural
      // `1-8-2026` becomes `01-08-2026`. A four-digit year is not: padding `26` to `0026`
      // invents a date in the year 26 that then looks perfectly well-formed to the parser.
      // Leaving it short keeps it a half-typed year, which `parseDateInput` rejects.
      const { length } = tokens[index]!
      values[index] = length > 2 ? buffer : buffer.padStart(length, "0")
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
 * Widens single-letter `d` / `M` to their zero-padded form, leaving every other token alone.
 *
 * `MMM` and `MMMM` are month *names*, not widths, so only an exactly-one-character chunk is
 * doubled.
 */
function padNumericTokens(dateFormat: string): string {
  const chunks = dateFormat.match(/([a-zA-Z])\1*|[^a-zA-Z]+/g)
  if (!chunks) return dateFormat
  return chunks.map((chunk) => (chunk === "d" || chunk === "M" ? chunk + chunk : chunk)).join("")
}

/**
 * Parses typed text against `dateFormat`, accepting it only when it is written the way
 * `dateFormat` renders a date.
 *
 * The test is a round trip: parse the text, format the result with the same `dateFormat`, and
 * require the two strings to match. That is the literal reading of "the value must be in
 * `dateFormat`", and it holds for every format without special cases:
 *
 * - `dd-MM-yyyy` renders `01-08-2026`, so `1-8-2026` and `26-8-2026` are rejected — `dd`
 *   means two digits. This is the case that used to slip through.
 * - `26-08-20` parses to the year 20, re-renders as `26-08-0020`, and is rejected — a
 *   half-typed year is not a date in the year 20.
 * - `26/08/2026` never matches a `-` separator, and `31-02-2026` is rejected by `date-fns`
 *   before the round trip is reached.
 * - Named tokens work on the same terms: `dd MMM yyyy` takes `26 Aug 2026` and rejects
 *   `26 aug 2026`.
 *
 * The zero-padded rendering is accepted as well, which only widens anything for a format
 * whose tokens are single letters. `maskDateInput` has to commit to a width while the user is
 * still typing and pads to two, so a strict-only rule would reject every value a `d-M-yyyy`
 * field can produce — the mask would fight the parser and the field would never accept input.
 * For `dd-MM-yyyy` and friends the padded form *is* the format, so nothing is loosened.
 */
export function parseDateInput(value: string, dateFormat: string): Date | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const parsed = parse(trimmed, dateFormat, new Date())
  if (!isValid(parsed)) return undefined

  if (format(parsed, dateFormat) === trimmed) return parsed

  const padded = padNumericTokens(dateFormat)
  return padded !== dateFormat && format(parsed, padded) === trimmed ? parsed : undefined
}
