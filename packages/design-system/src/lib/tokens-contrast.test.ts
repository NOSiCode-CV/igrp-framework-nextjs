import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { IGRPColors } from "./colors.js"

/**
 * WCAG 2.1 AA contrast gate over `tokens.css`.
 *
 * The palette is authored in OKLCH, so a token edit that looks harmless can drop a
 * pair below the threshold with nothing to catch it. This converts each token to
 * sRGB, computes the real contrast ratio, and fails the build on a regression.
 *
 * Thresholds: 4.5:1 for body text (1.4.3), 3:1 for UI component boundaries and
 * focus indicators (1.4.11).
 */

// Vitest runs with the package root as cwd; import.meta.url is rewritten under jsdom.
const TOKENS_CSS = resolve(process.cwd(), "src/tokens.css")

type Rgb = readonly [number, number, number]
/** A colour that may still need compositing over a surface before it can be judged. */
type Token = { rgb: Rgb; alpha: number }

const AA_TEXT = 4.5
const AA_NON_TEXT = 3

/** OKLCH → linear sRGB (Björn Ottosson's matrices), clamped to gamut. */
function oklchToRgb(l: number, c: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  const lCube = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mCube = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sCube = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube,
    -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube,
    -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube,
  ].map((v) => Math.min(1, Math.max(0, v))) as unknown as Rgb
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b

function contrast(fg: Rgb, bg: Rgb) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Composite a partially transparent colour over an opaque surface. */
const flatten = (token: Token, surface: Rgb): Rgb =>
  token.rgb.map((v, i) => v * token.alpha + surface[i] * (1 - token.alpha)) as unknown as Rgb

const OKLCH = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%)?\s*\)/

/** Parse one `:root {}` / `.dark {}` block into resolvable tokens. */
function parseBlock(css: string, selector: string): Record<string, Token> {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`${selector} not found in tokens.css`)
  const body = css.slice(start, css.indexOf("}", start))

  const out: Record<string, Token> = {}
  for (const [, name, value] of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    const m = OKLCH.exec(value)
    if (!m) continue // color-mix()/var() indirections are not gated here
    out[name] = {
      rgb: oklchToRgb(Number(m[1]), Number(m[2]), Number(m[3])),
      alpha: m[4] === undefined ? 1 : Number(m[4]) / 100,
    }
  }
  return out
}

const css = readFileSync(TOKENS_CSS, "utf8")
const MODES = {
  light: parseBlock(css, ":root {"),
  dark: parseBlock(css, ".dark {"),
} as const

/** Semantic colours that ship an outline / solid / soft trio. */
const SEMANTIC = ["destructive", "success", "warning", "info", "indigo"] as const

/** Opaque surfaces a component can sit on. */
const SURFACES = ["background", "card", "sidebar"] as const

/** The tint strength `IGRPColors.soft[color].bg` actually applies, e.g. `bg-warning/5` → 0.05. */
function softTint(color: (typeof SEMANTIC)[number]): number | null {
  const bg = IGRPColors.soft[color]?.bg
  const m = bg?.match(/^bg-[a-z-]+\/(\d+)$/)
  return m ? Number(m[1]) / 100 : null
}

describe.each(["light", "dark"] as const)("tokens.css — %s", (mode) => {
  const T = MODES[mode]
  const surface = (name: string): Rgb => {
    const token = T[name]
    if (!token) throw new Error(`--${name} missing in ${mode}`)
    // A translucent surface token (e.g. dark --border) is judged over the page.
    return token.alpha === 1 ? token.rgb : flatten(token, T.background.rgb)
  }

  const expectRatio = (fg: Rgb, bg: Rgb, min: number, label: string) => {
    const ratio = contrast(fg, bg)
    expect(ratio, `${label} is ${ratio.toFixed(2)}:1, needs ${min}:1`).toBeGreaterThanOrEqual(min)
  }

  describe("body text (1.4.3 — 4.5:1)", () => {
    it.each([
      ["foreground", "background"],
      ["card-foreground", "card"],
      ["popover-foreground", "popover"],
      ["muted-foreground", "background"],
      ["muted-foreground", "muted"],
      ["muted-foreground", "card"],
      ["primary-foreground", "primary"],
      ["secondary-foreground", "secondary"],
      ["accent-foreground", "accent"],
      ["highlight-foreground", "highlight"],
      ["sidebar-foreground", "sidebar"],
      ["sidebar-primary-foreground", "sidebar-primary"],
      ["sidebar-accent-foreground", "sidebar-accent"],
    ])("--%s on --%s", (fg, bg) => {
      expectRatio(T[fg].rgb, surface(bg), AA_TEXT, `--${fg} on --${bg}`)
    })
  })

  describe.each(SEMANTIC)("%s", (color) => {
    it(`solid: --${color}-foreground on --${color}`, () => {
      expectRatio(T[`${color}-foreground`].rgb, T[color].rgb, AA_TEXT, `solid ${color}`)
    })

    it.each(SURFACES)(`outline: text-${color} on --%s`, (bg) => {
      expectRatio(T[color].rgb, surface(bg), AA_TEXT, `text-${color} on --${bg}`)
    })

    it.each(SURFACES)(`soft: text-${color} on its own tint over --%s`, (bg) => {
      const tint = softTint(color)
      expect(tint, `IGRPColors.soft.${color}.bg must be a bg-<color>/<alpha> class`).not.toBeNull()
      const tinted = flatten({ rgb: T[color].rgb, alpha: tint as number }, surface(bg))
      expectRatio(T[color].rgb, tinted, AA_TEXT, `soft ${color} over --${bg}`)
    })

    it(`is distinguishable as a graphic on --background (${AA_NON_TEXT}:1)`, () => {
      expectRatio(T[color].rgb, surface("background"), AA_NON_TEXT, `${color} swatch`)
    })
  })

  // `--border` and `--sidebar-border` are deliberately NOT gated here. 1.4.11
  // covers the visual information needed to identify a control, and every
  // control draws its boundary with `--input` (input, select, checkbox, radio,
  // textarea, toggle, OTP, SidebarInput) or `--ring` (focus). `--border` is
  // decorative — separators, card edges, table rules, the base `* { border-color }`
  // — and gating it at 3:1 turned every divider into a heavy dark line
  // (restored to 0.929 on 2026-09-24). The outline Button uses `border-border`,
  // which is fine: its text label identifies it, so the edge is not required.
  // A control whose edge IS its only cue (no label, no fill) must use
  // `border-input` — don't darken the token instead.
  describe("UI boundaries and focus indicators (1.4.11 — 3:1)", () => {
    it.each([
      ["input", "background"],
      ["input", "card"],
      ["ring", "background"],
      ["ring", "card"],
      ["sidebar-ring", "sidebar"],
    ])("--%s against --%s", (token, bg) => {
      const against = surface(bg)
      const resolved = T[token].alpha === 1 ? T[token].rgb : flatten(T[token], against)
      expectRatio(resolved, against, AA_NON_TEXT, `--${token} on --${bg}`)
    })
  })
})
