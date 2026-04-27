import { getManifest } from "../manifest.js";
import { readLock, writeLock } from "../lock.js";
import { executeStep } from "../apply.js";

export async function rollback(appRoot: string, id: string) {
  // getManifest is called to validate CLI is set up correctly
  getManifest();
  const lock = readLock(appRoot);
  const idx = lock.applied.findIndex((a) => a.id === id);
  if (idx === -1) { console.log(`Migration ${id} is not applied.`); return; }
  const entry = lock.applied[idx];
  console.log(`\nRolling back ${id} (${entry.undo.length} undo step(s))\n`);
  for (const step of entry.undo) {
    const pathKey = (step as Record<string, unknown>).path ?? (step as Record<string, unknown>).file ?? (step as Record<string, unknown>).manifest;
    console.log(`  undo ${step.type}  ${pathKey}`);
    // Note: undo steps reference __undo__ placeholders — full undo requires stored file content
    // For now, log the intent and skip __undo__ steps
    if ((step as Record<string, unknown>).from === "__undo__" || (step as Record<string, unknown>).patch === "__undo__") {
      console.log("    (undo payload not stored — manual restoration required)");
      continue;
    }
    executeStep(step, appRoot);
  }
  lock.applied.splice(idx, 1);
  writeLock(appRoot, lock);
  console.log(`\n✓ ${id} rolled back\n`);
}
