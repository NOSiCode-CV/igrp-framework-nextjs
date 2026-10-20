/**
 * Reports drift between local Primitives and upstream shadcn.
 *
 * This talks to the shadcn registry over HTTP directly — it does NOT shell out
 * to the `shadcn` CLI. The previous CLI-based implementation could not work:
 * `shadcn init` prompts for a project name and exits 0 without creating
 * anything when stdin is closed, `shadcn add` has no `--base` flag (that lives
 * on `init` only), and `add --diff` compares the registry against the scratch
 * project's own files — the local primitive was never placed where the CLI
 * would have seen it. See `drift-baseline-2026-05.md`.
 *
 * ## What "drift" means here
 *
 * Our primitives carry deliberate IGRP deltas (see COMPONENTS.md), so "local
 * differs from upstream" is permanently true and useless as a signal. What we
 * actually want to know is: **has upstream moved since we last looked?**
 *
 * So each primitive's normalized upstream source is hashed into
 * `shadcn-upstream.lock.json`. A run compares today's upstream hash against the
 * recorded one:
 *
 *   unchanged        upstream is identical to the recorded baseline
 *   upstream-changed upstream moved — review the diff, then re-baseline
 *   new              no baseline recorded yet for this primitive
 *   local-only       not in the shadcn registry (an IGRP-authored primitive)
 *   unavailable      could not be fetched or parsed — never treated as "ok"
 *
 * ## Usage
 *
 *   node scripts/check-shadcn-drift.mjs           report (exit 1 on drift)
 *   node scripts/check-shadcn-drift.mjs --update  accept current upstream as
 *                                                 the new baseline
 *   node scripts/check-shadcn-drift.mjs --json    machine-readable report
 *
 * Hits the network; intended for periodic (~quarterly) maintenance, not CI.
 */
import { readFile, writeFile, readdir } from "node:fs/promises"
import { join, resolve, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, "..")
const PRIMITIVES_DIR = join(PACKAGE_ROOT, "src", "components", "primitives")
const LOCK_PATH = join(__dirname, "shadcn-upstream.lock.json")

/**
 * The registry serves items at /r/styles/{style}/{name}.json — the style slug
 * and the `base` query parameter are both taken from the CLI's own resolver
 * (`shadcn@4.21.0`, dist/chunk-B2MD6U5O.js). `new-york-v4` serves the
 * Radix-based (`asChild`) variant, which is the one this package tracks.
 */
const REGISTRY_STYLE = "new-york-v4"
const REGISTRY_BASE = "radix"
const CONCURRENCY = 8

export function registryUrl(name) {
  return `https://ui.shadcn.com/r/styles/${REGISTRY_STYLE}/${name}.json?base=${REGISTRY_BASE}`
}

/**
 * The stamp may be a line comment or a block comment, and may sit below other
 * leading comments (an `eslint-disable`, most commonly). Only the leading
 * comment block is scanned — a stamp that appears after real code is ignored,
 * because it is then a comment about something else.
 */
const STAMP_RE = /^(?:\/\/|\/\*)\s*shadcn:\s*(\d{4}-\d{2}-\d{2})\b/

export function parseStampDate(source) {
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === "") continue
    // Stop at the first line that is not part of the leading comment block.
    if (!trimmed.startsWith("//") && !trimmed.startsWith("/*") && !trimmed.startsWith("*")) return null
    const m = STAMP_RE.exec(trimmed)
    if (m) return m[1]
  }
  return null
}

export async function listPrimitives() {
  const entries = await readdir(PRIMITIVES_DIR, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".tsx"))
    .map((e) => e.name)
    .sort()
}

function stripLeadingComments(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n")
  let i = 0
  while (i < lines.length) {
    const t = lines[i].trim()
    if (t === "") {
      i++
      continue
    }
    // Keep a "use client" directive — it is part of the module's meaning.
    if (/^["']use [a-z]+["'];?$/.test(t)) break
    if (t.startsWith("//") || (t.startsWith("/*") && t.endsWith("*/"))) {
      i++
      continue
    }
    break
  }
  return lines.slice(i).join("\n")
}

/**
 * Strips the differences that are structural rather than semantic, so a hash
 * only moves when upstream's actual source moves:
 *   - CRLF to LF, trailing whitespace, trailing blank lines
 *   - upstream's `@/` aliases to this package's relative paths
 *   - the leading comment block (our stamp / eslint-disable headers)
 */
export function normalizeSource(source) {
  return stripLeadingComments(source)
    .replace(/@\/lib\/utils/g, "../../lib/utils")
    .replace(/@\/components\/ui\//g, "./")
    .replace(/@\/registry\/[^/]+\/ui\//g, "./")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "\n")
}

export function hashSource(normalized) {
  return createHash("sha256").update(normalized, "utf8").digest("hex").slice(0, 16)
}

/** Minimal LCS-based unified diff — enough to eyeball an upstream change. */
export function diffLines(a, b, context = 3) {
  const A = a.split("\n")
  const B = b.split("\n")
  const n = A.length
  const m = B.length
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = A[i] === B[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const ops = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      ops.push(["=", A[i]])
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push(["-", A[i]])
      i++
    } else {
      ops.push(["+", B[j]])
      j++
    }
  }
  while (i < n) ops.push(["-", A[i++]])
  while (j < m) ops.push(["+", B[j++]])

  // Collapse runs of unchanged lines down to `context` lines either side.
  const keep = new Array(ops.length).fill(false)
  ops.forEach(([kind], idx) => {
    if (kind === "=") return
    for (let k = Math.max(0, idx - context); k <= Math.min(ops.length - 1, idx + context); k++) keep[k] = true
  })

  const out = []
  let skipping = false
  ops.forEach(([kind, text], idx) => {
    if (!keep[idx]) {
      if (!skipping) {
        out.push("  ...")
        skipping = true
      }
      return
    }
    skipping = false
    out.push(`${kind === "=" ? " " : kind} ${text}`)
  })
  return out.join("\n")
}

async function fetchUpstream(name) {
  const url = registryUrl(name)
  const res = await fetch(url, { headers: { accept: "application/json" } })
  if (res.status === 404) return { kind: "local-only" }
  if (!res.ok) return { kind: "unavailable", reason: `HTTP ${res.status} from ${url}` }

  let json
  try {
    json = await res.json()
  } catch (err) {
    return { kind: "unavailable", reason: `registry response was not JSON: ${err.message}` }
  }

  const file = json?.files?.find((f) => f?.path?.endsWith(`${name}.tsx`)) ?? json?.files?.[0]
  if (typeof file?.content !== "string") {
    return { kind: "unavailable", reason: `registry item has no file content (${url})` }
  }
  return { kind: "ok", content: file.content }
}

export async function checkOne(file, lock) {
  const name = basename(file, ".tsx")
  const local = await readFile(join(PRIMITIVES_DIR, file), "utf8")
  const stamp = parseStampDate(local)

  let upstream
  try {
    upstream = await fetchUpstream(name)
  } catch (err) {
    upstream = { kind: "unavailable", reason: err.message }
  }

  if (upstream.kind !== "ok") {
    return { file, name, stamp, status: upstream.kind, reason: upstream.reason }
  }

  const normalizedUpstream = normalizeSource(upstream.content)
  const hash = hashSource(normalizedUpstream)
  const recorded = lock.primitives?.[name]?.upstreamHash
  const status = recorded === undefined ? "new" : recorded === hash ? "unchanged" : "upstream-changed"

  return {
    file,
    name,
    stamp,
    status,
    hash,
    recordedHash: recorded,
    diff: status === "unchanged" ? null : diffLines(normalizeSource(local), normalizedUpstream),
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const idx = next++
        out[idx] = await fn(items[idx])
      }
    })
  )
  return out
}

async function readLock() {
  try {
    return JSON.parse(await readFile(LOCK_PATH, "utf8"))
  } catch {
    return { primitives: {} }
  }
}

async function main(argv) {
  const update = argv.includes("--update")
  const asJson = argv.includes("--json")
  const files = await listPrimitives()
  const lock = await readLock()

  if (!asJson) process.stderr.write(`Checking ${files.length} primitives against the shadcn registry...\n`)
  const results = await mapLimit(files, CONCURRENCY, (f) => checkOne(f, lock))

  const by = (s) => results.filter((r) => r.status === s)
  const changed = by("upstream-changed")
  const fresh = by("new")
  const unavailable = by("unavailable")
  const localOnly = by("local-only")

  if (update) {
    const primitives = { ...(lock.primitives ?? {}) }
    const checkedAt = new Date().toISOString().slice(0, 10)
    for (const r of results) {
      if (r.hash) primitives[r.name] = { upstreamHash: r.hash, checkedAt }
    }
    const body = { style: REGISTRY_STYLE, base: REGISTRY_BASE, primitives }
    await writeFile(LOCK_PATH, `${JSON.stringify(body, null, 2)}\n`)
    console.log(`Baseline updated: ${Object.keys(primitives).length} primitives recorded in ${basename(LOCK_PATH)}.`)
    // An unavailable primitive was not recorded, so it must still fail the run.
    process.exit(unavailable.length > 0 ? 1 : 0)
  }

  if (asJson) {
    console.log(JSON.stringify(results, null, 2))
    process.exit(changed.length + fresh.length + unavailable.length > 0 ? 1 : 0)
  }

  console.log(
    `\n${by("unchanged").length} unchanged - ${changed.length} upstream-changed - ` +
      `${fresh.length} new - ${localOnly.length} local-only - ${unavailable.length} unavailable`
  )

  for (const r of changed) {
    console.log(`\n=== ${r.file} - upstream changed (stamp: ${r.stamp ?? "<none>"}) ===`)
    console.log(`baseline ${r.recordedHash} -> upstream ${r.hash}`)
    console.log(r.diff)
  }

  if (fresh.length > 0) {
    console.log(`\nNo baseline recorded for: ${fresh.map((r) => r.name).join(", ")}`)
    console.log("Review these, then run with --update to accept the current upstream as the baseline.")
  }
  if (localOnly.length > 0) {
    console.log(`\nNot in the shadcn registry (IGRP-authored): ${localOnly.map((r) => r.name).join(", ")}`)
  }
  if (unavailable.length > 0) {
    console.log("\nCould NOT be compared - this is a failure, not a pass:")
    for (const r of unavailable) console.log(`  ${r.name}: ${r.reason}`)
  }

  const missingStamp = results.filter((r) => r.status !== "local-only" && !r.stamp)
  const today = new Date().toISOString().slice(0, 10)
  const futureStamp = results.filter((r) => r.stamp && r.stamp > today)
  if (missingStamp.length > 0) {
    console.log(`\nMissing shadcn stamp: ${missingStamp.map((r) => r.name).join(", ")}`)
  }
  if (futureStamp.length > 0) {
    console.log(`Stamp dated in the future: ${futureStamp.map((r) => `${r.name} (${r.stamp})`).join(", ")}`)
  }

  process.exit(changed.length + fresh.length + unavailable.length > 0 ? 1 : 0)
}

// Allow this file to be imported by tests without executing main().
const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err)
    process.exit(2)
  })
}
