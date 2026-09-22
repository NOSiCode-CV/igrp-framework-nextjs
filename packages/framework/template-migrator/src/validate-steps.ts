// Pack-time validation of every migration step's shape.
//
// The packer used to copy frontmatter straight into the manifest and check only
// ids and `requires`. Everything else — a typo'd `type`, a `file.write` with no
// `from`, an unsupported `mode: "patch"` — shipped happily and first surfaced in
// a consumer's app, thrown by `executeStep` PART WAY THROUGH a migration. The
// transactional unwind puts the files back, but the release is already out.
//
// These are the same constraints `executeStep` enforces at runtime, moved to the
// one place where failing is free.

const FILE_TYPES = new Set(["file.create", "file.write", "file.delete"]);

function requireString(step: Record<string, unknown>, field: string, where: string): string {
  const value = step[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${where}: "${field}" must be a non-empty string.`);
  }
  return value;
}

function requireRecord(step: Record<string, unknown>, field: string, where: string): Record<string, unknown> {
  const value = step[field];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${where}: "${field}" must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireStringArray(step: Record<string, unknown>, field: string, where: string): string[] {
  const value = step[field];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new Error(`${where}: "${field}" must be an array of strings.`);
  }
  return value as string[];
}

/**
 * App-relative, forward-only. `executeStep` refuses to write outside the app
 * root at runtime; catching it here means the migration never ships at all.
 */
function requireAppRelative(path: string, where: string): void {
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) {
    throw new Error(`${where}: path "${path}" must be relative to the app root.`);
  }
  if (path.split(/[\/]/).includes("..")) {
    throw new Error(`${where}: path "${path}" must not contain "..".`);
  }
}

export function validateSteps(migrationId: string, steps: unknown): void {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error(`Migration ${migrationId}: "steps" must be a non-empty array.`);
  }

  steps.forEach((raw, i) => {
    const where = `Migration ${migrationId}, step ${i + 1}`;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      throw new Error(`${where}: each step must be an object.`);
    }
    const step = raw as Record<string, unknown>;
    const type = requireString(step, "type", where);

    if (FILE_TYPES.has(type)) {
      requireAppRelative(requireString(step, "path", where), where);
    }

    switch (type) {
      case "file.create":
        requireString(step, "from", where);
        break;
      case "file.write": {
        const mode = requireString(step, "mode", where);
        if (mode !== "replace") {
          // `patch` is in the step union but `executeStep` throws on it, and no
          // migration has ever used it. Undocumented, unimplemented, and it
          // would fail mid-apply in a consumer app.
          throw new Error(
            `${where}: file.write mode "${mode}" is not supported — use mode: "replace" ` +
              "with a full-file payload via \"from\".",
          );
        }
        requireString(step, "from", where);
        break;
      }
      case "file.delete":
        break;
      case "env.add": {
        requireAppRelative(requireString(step, "file", where), where);
        const keys = requireRecord(step, "keys", where);
        for (const [key, spec] of Object.entries(keys)) {
          if (typeof spec !== "object" || spec === null) {
            throw new Error(`${where}: env key "${key}" must map to an object with a "doc".`);
          }
          requireString(spec as Record<string, unknown>, "doc", `${where} (key "${key}")`);
        }
        break;
      }
      case "env.remove":
        requireAppRelative(requireString(step, "file", where), where);
        requireStringArray(step, "keys", where);
        break;
      case "deps.bump": {
        requireAppRelative(requireString(step, "manifest", where), where);
        const ranges = requireRecord(step, "ranges", where);
        for (const [dep, range] of Object.entries(ranges)) {
          if (typeof range !== "string" || range.trim() === "") {
            throw new Error(`${where}: range for "${dep}" must be a non-empty string.`);
          }
        }
        break;
      }
      case "deps.remove":
        requireAppRelative(requireString(step, "manifest", where), where);
        requireStringArray(step, "deps", where);
        break;
      case "deps.restore":
        requireAppRelative(requireString(step, "manifest", where), where);
        requireRecord(step, "removed", where);
        break;
      default:
        throw new Error(`${where}: unknown step type "${type}".`);
    }
  });
}
