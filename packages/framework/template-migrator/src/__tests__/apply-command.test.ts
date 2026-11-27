import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { readLock } from "../lock";
import type { Manifest } from "../types";

const manifestRef: { current: Manifest } = {
  current: { version: 1, cliVersion: "test", template: "demo-v1", migrations: [] },
};

vi.mock("../manifest", () => ({
  getManifest: () => manifestRef.current,
}));

import { apply } from "../commands/apply";

let appRoot: string;
let payloadDir: string;

function writeFileAt(base: string, rel: string, content: string) {
  const p = join(base, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, "utf8");
}

beforeEach(() => {
  appRoot = mkdtempSync(join(tmpdir(), "tm-applycmd-"));
  payloadDir = mkdtempSync(join(tmpdir(), "tm-applycmd-payload-"));
});

afterEach(() => {
  rmSync(appRoot, { recursive: true, force: true });
  rmSync(payloadDir, { recursive: true, force: true });
});

describe("apply refuses unrestorable steps", () => {
  it("refuses a directory delete, since its contents could never be restored", async () => {
    writeFileAt(appRoot, "src/dead-dir/file.txt", "x\n");

    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-v1",
      migrations: [
        {
          id: "12-dir-delete-test",
          date: "2026-06-10",
          requires: [],
          targetFrameworkVersion: null,
          guideHref: "12.MIGRATIONS-10062026.md",
          contentHash: "deadbeefdeadbeef",
          steps: [{ type: "file.delete", path: "src/dead-dir" }],
        },
      ],
    };

    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await apply(appRoot, { yes: true, payloadDir })).toBe(false);

    expect(readFileSync(join(appRoot, "src/dead-dir/file.txt"), "utf8")).toBe("x\n");
    expect(readLock(appRoot).applied).toHaveLength(0);
    expect(existsSync(join(appRoot, ".igrp-migration-journal.json"))).toBe(false);
  });

});

describe("apply rolls back already-executed steps on mid-migration failure", () => {
  it("restores the overwritten file and writes no lock entry when a later step throws", async () => {
    writeFileAt(appRoot, "src/a.ts", "ORIGINAL A\n");
    writeFileAt(payloadDir, "30/src/a.ts", "MIGRATED A\n");
    // NOTE: payload 30/src/b.ts is intentionally NOT written → step 2 throws ENOENT.

    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-v1",
      migrations: [
        {
          id: "30-partial-fail",
          date: "2026-06-26",
          requires: [],
          targetFrameworkVersion: null,
          guideHref: "30.MIGRATIONS-26062026.md",
          contentHash: "30303030303030303",
          steps: [
            { type: "file.write", mode: "replace", path: "src/a.ts", from: "30/src/a.ts" },
            { type: "file.write", mode: "replace", path: "src/b.ts", from: "30/src/b.ts" },
          ],
        },
      ],
    };

    await apply(appRoot, { yes: true, payloadDir });

    // Step 1's file was unwound back to its true pre-migration content.
    expect(readFileSync(join(appRoot, "src/a.ts"), "utf8")).toBe("ORIGINAL A\n");
    // No lock entry — migration is still pending, so a re-run re-baselines cleanly.
    expect(readLock(appRoot).applied).toHaveLength(0);
    // step 2 threw before writing, so the half-written file must not exist
    expect(existsSync(join(appRoot, "src/b.ts"))).toBe(false);
  });
});

describe("migration 22 swaps isPreviewMode for isAuthBypass", () => {
  it("applies the get-session-args payload over the old file", async () => {
    writeFileAt(appRoot, "src/lib/config/get-session-args.ts", 'import { isPreviewMode } from "../utils";\n');
    writeFileAt(payloadDir, "22/lib/config/get-session-args.ts", 'import { isAuthBypass } from "../utils";\n');
    manifestRef.current = {
      version: 1, cliVersion: "test", template: "demo-v1",
      migrations: [{
        id: "22-session-args-auth-bypass", date: "2026-06-26", requires: [],
        targetFrameworkVersion: null, guideHref: "22.MIGRATIONS-26062026.md", contentHash: "22222222222222222",
        steps: [{ type: "file.write", mode: "replace", path: "src/lib/config/get-session-args.ts", from: "22/lib/config/get-session-args.ts" }],
      }],
    };
    await apply(appRoot, { yes: true, payloadDir });
    expect(readFileSync(join(appRoot, "src/lib/config/get-session-args.ts"), "utf8")).toContain("isAuthBypass");
  });
});

describe("apply enforces migration prerequisites", () => {
  it("refuses a migration whose requires are not applied", async () => {
    // Provide the payload so the step would succeed if the requires guard didn't fire.
    writeFileAt(payloadDir, "x/src/x.ts", "export const x = 1;\n");
    manifestRef.current = {
      version: 1, cliVersion: "test", template: "demo-v1",
      migrations: [{
        id: "needs-missing", date: "2026-06-26", requires: ["not-applied"],
        targetFrameworkVersion: null, guideHref: "x.md", contentHash: "f".repeat(16),
        steps: [{ type: "file.create", path: "src/x.ts", from: "x/src/x.ts" }],
      }],
    };
    await apply(appRoot, { yes: true, payloadDir });
    expect(readLock(appRoot).applied).toHaveLength(0);
  });
});

describe("migration 23 rewrites the routes helper", () => {
  it("applies the get-routes payload", async () => {
    writeFileAt(appRoot, "src/lib/config/get-routes.ts", "OLD\n");
    writeFileAt(payloadDir, "23/lib/config/get-routes.ts", "let cached;\nexport function getRoutes() {}\n");
    manifestRef.current = {
      version: 1, cliVersion: "test", template: "demo-v1",
      migrations: [{
        id: "23-per-request-layout-and-routes-cache", date: "2026-06-27",
        requires: [], targetFrameworkVersion: null, guideHref: "23.MIGRATIONS-27062026.md", contentHash: "3".repeat(16),
        steps: [{ type: "file.write", mode: "replace", path: "src/lib/config/get-routes.ts", from: "23/lib/config/get-routes.ts" }],
      }],
    };
    await apply(appRoot, { yes: true, payloadDir });
    expect(readFileSync(join(appRoot, "src/lib/config/get-routes.ts"), "utf8")).toContain("cached");
  });
});

describe("apply self-heals the template identifier", () => {
  it("upgrades a stale demo-v1 lock to the current manifest template", async () => {
    // An app previously migrated under the former "demo-v1" identifier.
    writeFileSync(
      join(appRoot, ".igrp-migrations-lock.json"),
      JSON.stringify({ version: 1, template: "demo-v1", applied: [] }),
      "utf8"
    );
    writeFileAt(payloadDir, "21/src/new.ts", "NEW\n");

    manifestRef.current = {
      version: 1,
      cliVersion: "test",
      template: "demo-v1",
      migrations: [
        {
          id: "21-heal-test",
          date: "2026-06-25",
          requires: [],
          targetFrameworkVersion: null,
          guideHref: "21.MIGRATIONS-25062026.md",
          contentHash: "abcabcabcabcabca",
          steps: [{ type: "file.create", path: "src/new.ts", from: "21/src/new.ts" }],
        },
      ],
    };

    await apply(appRoot, { yes: true, payloadDir });

    expect(readLock(appRoot).applied).toHaveLength(1);
    expect(readLock(appRoot).template).toBe("demo-v1");
  });
});

/** One migration: overwrite src/a.ts, create src/new.ts. */
function setEditableManifest() {
  writeFileAt(payloadDir, "50/src/a.ts", "MIGRATED A\n");
  writeFileAt(payloadDir, "50/src/new.ts", "NEW\n");
  manifestRef.current = {
    version: 1, cliVersion: "test", template: "demo-v1",
    migrations: [{
      id: "50-edit-test", date: "2026-11-13", requires: [], targetFrameworkVersion: null,
      guideHref: "50.md", contentHash: "5".repeat(16),
      steps: [
        { type: "file.write", mode: "replace", path: "src/a.ts", from: "50/src/a.ts" },
        { type: "file.create", path: "src/new.ts", from: "50/src/new.ts" },
      ],
    }],
  };
}

describe("apply --to", () => {
  it("succeeds without work when the target is already applied", async () => {
    writeFileAt(appRoot, "src/a.ts", "ORIGINAL A\n");
    setEditableManifest();
    expect(await apply(appRoot, { yes: true, payloadDir, toId: "50-edit-test" })).toBe(true);
    expect(await apply(appRoot, { yes: true, payloadDir, toId: "50-edit-test" })).toBe(true);
    expect(await apply(appRoot, { yes: true, payloadDir, toId: "99-missing" })).toBe(false);
  });
});

describe("apply reports failure", () => {
  it("returns false when it aborts", async () => {
    writeFileAt(payloadDir, "x/src/x.ts", "x\n");
    manifestRef.current = {
      version: 1, cliVersion: "test", template: "demo-v1",
      migrations: [{
        id: "needs-missing", date: "2026-06-26", requires: ["not-applied"],
        targetFrameworkVersion: null, guideHref: "x.md", contentHash: "f".repeat(16),
        steps: [{ type: "file.create", path: "src/x.ts", from: "x/src/x.ts" }],
      }],
    };
    expect(await apply(appRoot, { yes: true, payloadDir })).toBe(false);
  });

  it("fails fast without --yes when stdin is not a terminal", async () => {
    setEditableManifest();
    const tty = process.stdin.isTTY;
    process.stdin.isTTY = false;
    try {
      expect(await apply(appRoot, { payloadDir })).toBe(false);
    } finally {
      process.stdin.isTTY = tty;
    }
    expect(existsSync(join(appRoot, "src/new.ts"))).toBe(false);
  });
});

describe("apply warns before replacing a file no earlier migration wrote", () => {
  it("lists the path and still applies", async () => {
    writeFileAt(appRoot, "src/a.ts", "TEMPLATE ORIGINAL\n");
    setEditableManifest();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(await apply(appRoot, { yes: true, payloadDir })).toBe(true);
      const warned = warn.mock.calls.map((c) => String(c[0])).join("\n");
      expect(warned).toContain("src/a.ts");
      expect(warned).not.toContain("src/new.ts");
    } finally {
      warn.mockRestore();
    }
    expect(readFileSync(join(appRoot, "src/a.ts"), "utf8")).toBe("MIGRATED A\n");
  });
});
