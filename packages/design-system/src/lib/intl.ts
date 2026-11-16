// Constructing an `Intl` formatter costs far more than formatting with one, and
// cells, chart ticks and labels format on every render. Formatters are immutable,
// so one per (locale, options) pair is shared module-wide.
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()

function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat>(
  kind: string,
  locale: string,
  options: object | undefined,
  create: () => T
): T {
  const key = `${kind}|${locale}|${JSON.stringify(options ?? {})}`
  let formatter = cache.get(key) as T | undefined
  if (!formatter) {
    formatter = create()
    cache.set(key, formatter)
  }
  return formatter
}

/** @internal Shared `Intl.NumberFormat` for `locale` + `options`. */
export function igrpNumberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  return cached("n", locale, options, () => new Intl.NumberFormat(locale, options))
}

/** @internal Shared `Intl.DateTimeFormat` for `locale` + `options`. */
export function igrpDateTimeFormat(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return cached("d", locale, options, () => new Intl.DateTimeFormat(locale, options))
}
