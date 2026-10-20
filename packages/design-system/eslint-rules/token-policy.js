/**
 * Enforces the layer token policy documented in CLAUDE.md § `dark:` selector policy.
 *
 * Two checks, both run over class strings — string literals and the quasis of
 * template literals — so they cover `className="…"`, `cva("…")` and
 * `` cn(`…${x}…`) `` alike:
 *
 *   1. `raw-palette` — Tailwind's default palette is never allowed. Semantic
 *      tokens (`bg-primary`, `text-destructive`, `bg-success`) carry dark mode
 *      on their own; a raw palette colour does not.
 *   2. `dark-variant` — `dark:` is allowed ONLY in the Primitives layer, where
 *      it exists as shadcn's opacity adjustments of already-semantic tokens
 *      (`dark:bg-input/30`). Removing those creates permanent drift against
 *      upstream on every shadcn release, so Primitives pass
 *      `allowDarkVariant: true`. Horizon and Custom compose Primitives plus
 *      tokens and never need it.
 *
 * This lives as a real rule rather than `no-restricted-syntax` because
 * esquery's attribute regexes drop backslash escapes and terminate on `/`,
 * which mangles both patterns.
 */

const PALETTE = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
].join("|")

const COLOR_UTILITIES = [
  "bg",
  "text",
  "border",
  "ring",
  "outline",
  "decoration",
  "divide",
  "from",
  "via",
  "to",
  "fill",
  "stroke",
  "accent",
  "caret",
  "placeholder",
  "shadow",
].join("|")

/** e.g. `bg-emerald-500`, `dark:text-red-400`, `hover:border-blue-600/50`. */
const RAW_PALETTE = new RegExp(
  String.raw`(?<=^|[\s:])(?:${COLOR_UTILITIES})-(?:${PALETTE})-(?:50|[1-9]00|950)(?:\/\d{1,3})?(?=\s|$)`,
  "g"
)

/** Any `dark:` variant, alone or chained behind others (`md:dark:hover:`). */
const DARK_VARIANT = /(?<=^|\s)(?:[a-z0-9-]+:)*dark:/g

export const tokenPolicy = {
  meta: {
    type: "problem",
    docs: {
      description: "Use semantic design tokens; keep `dark:` out of the Horizon and Custom layers.",
    },
    schema: [
      {
        type: "object",
        properties: { allowDarkVariant: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
    messages: {
      rawPalette:
        "`{{token}}` is a raw Tailwind palette colour. Use a semantic token (bg-primary, text-destructive, bg-success…). If the role is missing, add a token to tokens.css — light block, dark block and @theme inline — rather than reaching for the palette.",
      darkVariant:
        "`{{token}}` is not allowed in the Horizon and Custom layers. Compose Primitives + semantic tokens; the tokens carry dark mode. (Primitives keep shadcn's `dark:` opacity adjustments — see CLAUDE.md.)",
    },
  },

  create(context) {
    const allowDarkVariant = context.options[0]?.allowDarkVariant ?? false

    const check = (node, text) => {
      for (const match of text.matchAll(RAW_PALETTE)) {
        context.report({ node, messageId: "rawPalette", data: { token: match[0] } })
      }
      if (allowDarkVariant) return
      for (const match of text.matchAll(DARK_VARIANT)) {
        context.report({ node, messageId: "darkVariant", data: { token: match[0] } })
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value)
      },
      TemplateElement(node) {
        check(node, node.value.raw)
      },
    }
  },
}

export default { rules: { "token-policy": tokenPolicy } }
