import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { checkLiterals, findLiteralStrings } from "../literals.js";

describe("findLiteralStrings", () => {
  it("flags JSX text, literal children and user-facing props", () => {
    const src = `
      export function X() {
        return (
          <div>
            <p>Olá</p>
            <span>{"Olá"}</span>
            <input placeholder="Nome" aria-label="Campo" />
            <Comp description="Desc" helperText={\`Ajuda\`} />
          </div>
        );
      }`;
    expect(findLiteralStrings(src)).toHaveLength(6);
  });

  it("accepts text without letters, translated values and non-user-facing props", () => {
    const src = `
      export function X({ t }) {
        return (
          <div className="p-2" data-x="y">
            <span>—</span>
            <span>{"→"}</span>
            <p>{t("title")}</p>
            <input placeholder={t("ph")} />
            <b>42</b>
          </div>
        );
      }`;
    expect(findLiteralStrings(src)).toEqual([]);
  });

  it("flags next-intl formatter imports (format through the framework helpers)", () => {
    expect(
      findLiteralStrings(`import { useFormatter } from "next-intl";`),
    ).toEqual([
      "1: import of useFormatter from next-intl (use useIGRPFormat / igrpFormatDate)",
    ]);
    expect(
      findLiteralStrings(`import { getFormatter } from "next-intl/server";`),
    ).toHaveLength(1);
    expect(
      findLiteralStrings(`import { useTranslations } from "next-intl";`),
    ).toEqual([]);
  });
});

describe("checkLiterals", () => {
  it("walks folders, skips tests, and prefixes findings with the file", () => {
    const d = mkdtempSync(join(tmpdir(), "igrp-i18n-lit-"));
    writeFileSync(join(d, "a.tsx"), `export const A = () => <p>Olá</p>;`);
    writeFileSync(join(d, "a.test.tsx"), `export const T = () => <p>Olá</p>;`);
    writeFileSync(join(d, "b.ts"), `export const b = "Olá";`);
    const findings = checkLiterals([d]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/a\.tsx:1: JSX text "Olá"/);
  });
});
