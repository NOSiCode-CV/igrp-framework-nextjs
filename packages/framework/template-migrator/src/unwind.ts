// Reversing the steps a migration already executed.
//
// Shared by two callers that must behave identically: the in-process catch in
// commands/apply.ts (a step threw) and the crash-recovery path (a previous run
// died mid-migration and left a journal). Keeping one implementation means a
// recovered crash and a caught error leave the tree in the same state.

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { executeStep } from "./apply.js";
import type { MigrationStep } from "./types.js";

/** An undo step that can only be satisfied from a stored payload. */
export function isPlaceholderUndo(step: MigrationStep): boolean {
  const s = step as { from?: unknown; patch?: unknown };
  return s.from === "__undo__" || s.patch === "__undo__";
}

export interface UnwindResult {
  reverted: number;
  failures: string[];
}

/**
 * Reverse `undoSteps` in reverse execution order.
 *
 * Reverse order matters when one migration touches the same path more than
 * once (delete-then-recreate): the recreated file must go before the original
 * is restored. Individual failures are collected rather than thrown, so one bad
 * step cannot strand the remaining ones.
 */
export function unwindSteps(
  undoSteps: MigrationStep[],
  undoPayloads: Record<string, string>,
  appRoot: string,
  payloadDir?: string,
): UnwindResult {
  const failures: string[] = [];
  let reverted = 0;

  for (const undo of [...undoSteps].reverse()) {
    try {
      if (isPlaceholderUndo(undo)) {
        const path = (undo as { path?: string }).path;
        const content = path !== undefined ? undoPayloads[path] : undefined;
        if (path === undefined || content === undefined) {
          // No stored content — nothing honest we can write. Surface it rather
          // than pretending the path was restored.
          failures.push(`${undo.type} ${path ?? "(unknown path)"}: no stored undo content`);
          continue;
        }
        const dest = join(appRoot, path);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, content, "utf8");
      } else {
        executeStep(undo, appRoot, payloadDir);
      }
      reverted++;
    } catch (err) {
      failures.push(`${undo.type}: ${(err as Error).message}`);
    }
  }

  return { reverted, failures };
}
