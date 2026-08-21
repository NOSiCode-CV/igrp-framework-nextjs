#!/usr/bin/env node
/**
 * Swaps `dist_optimized` (the Babel/React Compiler output) into `dist`,
 * replacing the previous `rimraf dist && move-cli dist_optimized dist` step.
 *
 * On Windows, deleting `dist` and immediately renaming a new directory into
 * that same path races against antivirus/file-indexer scans still holding a
 * handle on the just-deleted directory, which surfaces as a spurious
 * `EPERM: operation not permitted, rename ...` failure. This retries the
 * rename with backoff, and falls back to a copy+remove (which doesn't
 * require exclusive access to the `dist` path) if the lock never clears.
 */
import { existsSync, renameSync, rmSync, cpSync } from "node:fs"
import { setTimeout as sleep } from "node:timers/promises"

const SRC = "dist_optimized"
const DEST = "dist"
const MAX_ATTEMPTS = 10
const RETRY_DELAY_MS = 300

function isRetryable(err) {
  return err && (err.code === "EPERM" || err.code === "EBUSY" || err.code === "ENOTEMPTY")
}

async function main() {
  if (existsSync(DEST)) {
    rmSync(DEST, { recursive: true, force: true })
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      renameSync(SRC, DEST)
      return
    } catch (err) {
      if (!isRetryable(err)) throw err

      if (attempt === MAX_ATTEMPTS) {
        // Last resort: copy the tree and remove the source instead of
        // renaming, since a copy doesn't need an exclusive lock on DEST.
        cpSync(SRC, DEST, { recursive: true })
        rmSync(SRC, { recursive: true, force: true })
        return
      }

      await sleep(RETRY_DELAY_MS)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
