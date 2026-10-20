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

  it("accepts HTML entities that render as symbols", () => {
    expect(
      findLiteralStrings(
        `export const X = () => <span>&mdash;&nbsp;&#8594;</span>;`,
      ),
    ).toEqual([]);
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

describe("findLiteralStrings: conditionals and locales", () => {
  it.each([
    ['<p>{ok ? "Guardado" : "Erro"}</p>', 2],
    ['<p>{err && "Falhou"}</p>', 1],
    ['<p>{"Falhou" && err}</p>', 0],
    ['<p>{a || "Vazio"}</p>', 1],
    ['<p>{a ?? "Vazio"}</p>', 1],
    ['<X placeholder={ok ? "Nome" : "Apelido"} />', 2],
    ['<Spinner text="Aguarde..." />', 1],
    ['<X message="Erro" emptyText="Nada" />', 2],
  ])("flags %s", (src, n) => {
    expect(findLiteralStrings(src, "a.tsx")).toHaveLength(n);
  });

  it("flags hardcoded Intl locales in .ts", () => {
    const src =
      'new Intl.DateTimeFormat("pt").format(d); d.toLocaleDateString("pt-BR")';
    const found = findLiteralStrings(src, "a.ts");
    expect(found).toHaveLength(2);
    expect(found[0]).toContain('hardcoded locale "pt": use useIGRPFormat');
  });

  it("does not flag {cond && <Foo/>} or className ternaries", () => {
    expect(
      findLiteralStrings(
        '<p className={a ? "x" : "y"}>{a && <b/>}</p>',
        "a.tsx",
      ),
    ).toHaveLength(0);
  });

  it("scans .ts files but not tests or declarations", () => {
    const d = mkdtempSync(join(tmpdir(), "igrp-lit-"));
    for (const n of ["a.ts", "a.test.ts", "a.d.ts"]) {
      writeFileSync(join(d, n), 'x.toLocaleString("pt");');
    }
    expect(checkLiterals([d], d)).toHaveLength(1);
  });
});
