import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { checkCatalogs } from "../catalogs.js";

function dir(files: Record<string, unknown>): string {
  const d = mkdtempSync(join(tmpdir(), "igrp-i18n-"));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(d, name), JSON.stringify(content));
  }
  return d;
}

describe("checkCatalogs", () => {
  it("passes a consistent set and reports coverage", () => {
    const report = checkCatalogs({
      dir: dir({
        "pt.json": {
          users: {
            title: "Olá {name}",
            count: "{n, plural, one {# item} other {# itens}}",
          },
        },
        "en.json": { users: { title: "Hi {name}" } },
      }),
      defaultLocale: "pt",
    });
    expect(report.errors).toEqual([]);
    expect(report.coverage).toEqual({ pt: 100, en: 50 });
  });

  it("fails on orphan keys, non-string values, invalid ICU, argument mismatch and bad key names", () => {
    const report = checkCatalogs({
      dir: dir({
        "pt.json": {
          users: { title: "Olá {name}", Bad_Key: "x", broken: "{name" },
        },
        "fr.json": {
          users: { title: "Salut {prenom}", extra: "orphan", nested: { v: 1 } },
        },
      }),
      defaultLocale: "pt",
    });
    const text = report.errors.join("\n");
    expect(text).toMatch(/fr: orphan key "users.extra"/);
    expect(text).toMatch(/fr: "users.nested.v" is not a string/);
    expect(text).toMatch(/pt: invalid ICU in "users.broken"/);
    expect(text).toMatch(/fr: arguments of "users.title" differ from pt/);
    expect(text).toMatch(/pt: key segment "Bad_Key" is not camelCase/);
  });

  it("lists keys under framework namespaces as info, not errors", () => {
    const report = checkCatalogs({
      dir: dir({
        "pt.json": {
          common: { actions: { retry: "Repetir" } },
          app: { x: "y" },
        },
      }),
      defaultLocale: "pt",
      frameworkNamespaces: ["common", "i18n", "errors"],
    });
    expect(report.errors).toEqual([]);
    expect(report.info).toEqual([
      'pt: "common.actions.retry" shadows a framework namespace',
    ]);
  });

  it("fails when the default catalog is missing", () => {
    const report = checkCatalogs({
      dir: dir({ "en.json": {} }),
      defaultLocale: "pt",
    });
    expect(report.errors[0]).toMatch(/default catalog pt.json not found/);
  });
});
