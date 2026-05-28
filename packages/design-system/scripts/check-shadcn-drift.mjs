/**
 * Reports drift between local Primitives and upstream shadcn.
 *
 * For each .tsx under src/components/primitives/, this script:
 *   1. Reads the first-line `// shadcn: YYYY-MM-DD` stamp (if any).
 *   2. Runs `npx shadcn@latest add <name> --dry-run --diff <file>` in a
 *      scratch directory and captures the diff.
 *   3. Prints a per-file report: { stamp, hasDrift, diffSummary }.
 *
 * Exit code 0 if no drift is detected, 1 if any primitive has drifted.
 *
 * NOTE: this script is intended for periodic (~quarterly) maintenance,
 * not CI. It hits the network and is slow.
 */
import { readFile, readdir, mkdtemp } from "node:fs/promises"
import { join, resolve, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { spawn } from "node:child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, "..")
const PRIMITIVES_DIR = join(PACKAGE_ROOT, "src", "components", "primitives")

const STAMP_RE = /^\/\/\s*shadcn:\s*(\d{4}-\d{2}-\d{2})\b/

export function parseStampDate(source) {
  const firstLine = source.split(/\r?\n/, 1)[0] ?? ""
  const m = STAMP_RE.exec(firstLine)
  return m ? m[1] : null
}

export async function listPrimitives() {
  const entries = await readdir(PRIMITIVES_DIR, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".tsx"))
    .map((e) => e.name)
    .sort()
}

function run(cmd, args, opts) {
  return new Promise((resolveP, rejectP) => {
    // On Windows, `npx` (and other pnpm/npm shims) is a `.cmd` file that
    // child_process.spawn cannot resolve without a shell. shell:true is safe
    // here because all callers pass fixed, hard-coded arg lists.
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
      ...opts,
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (b) => (stdout += b.toString()))
    child.stderr.on("data", (b) => (stderr += b.toString()))
    child.on("error", rejectP)
    child.on("close", (code) => resolveP({ code, stdout, stderr }))
  })
}

async function checkOne(file, scratch) {
  const full = join(PRIMITIVES_DIR, file)
  const source = await readFile(full, "utf8")
  const stamp = parseStampDate(source)
  const name = basename(file, ".tsx")

  const { code, stdout, stderr } = await run(
    "npx",
    ["shadcn@latest", "add", name, "--dry-run", "--diff", "--base", "radix"],
    { cwd: scratch },
  )

  const hasDrift = code === 0 && stdout.includes("---")
  return { file, name, stamp, hasDrift, raw: stdout || stderr }
}

async function main() {
  const files = await listPrimitives()
  const scratch = await mkdtemp(join(tmpdir(), "shadcn-drift-"))

  // Initialize a throwaway shadcn project so `add --diff` has somewhere to compare against.
  await run("npx", ["shadcn@latest", "init", "--yes", "--defaults", "--base", "radix"], { cwd: scratch })

  const results = []
  for (const f of files) {
    process.stdout.write(`checking ${f}…`)
    const r = await checkOne(f, scratch)
    results.push(r)
    process.stdout.write(r.hasDrift ? " DRIFT\n" : " ok\n")
  }

  const drifted = results.filter((r) => r.hasDrift)
  console.log(`\n${drifted.length}/${results.length} primitives have drifted from upstream.`)
  for (const r of drifted) {
    console.log(`\n--- ${r.file} (stamp: ${r.stamp ?? "<none>"}) ---`)
    console.log(r.raw.slice(0, 4000))
  }
  process.exit(drifted.length > 0 ? 1 : 0)
}

// Allow this file to be imported by tests without executing main().
const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main().catch((err) => {
    console.error(err)
    process.exit(2)
  })
}
