#!/usr/bin/env node
import { checkCatalogs } from "./catalogs.js";
import { checkLiterals } from "./literals.js";

const USAGE = `igrp-i18n <command>

  check-catalogs <dir> --default <locale> [--framework-namespaces common,i18n,errors]
      Orphan keys, non-string values, invalid ICU, argument mismatches, camelCase segments.
  check-literals <path...>
      Hardcoded user-facing strings in non-test .tsx files; next-intl formatter imports.
`;

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

/** Positional arguments: everything that is neither an option nor an option's value. */
function positionals(args: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      i += 1;
      continue;
    }
    out.push(arg);
  }
  return out;
}

function main(argv: string[]): number {
  const [command, ...rest] = argv;
  if (command === "check-catalogs") {
    const dir = positionals(rest)[0];
    const defaultLocale = option(rest, "--default");
    if (!dir || !defaultLocale) {
      console.error(USAGE);
      return 2;
    }
    const namespaces =
      option(rest, "--framework-namespaces") ?? "common,i18n,errors";
    const report = checkCatalogs({
      dir,
      defaultLocale,
      frameworkNamespaces: namespaces.split(",").filter(Boolean),
    });
    for (const line of report.info) console.log(`info  ${line}`);
    console.log(
      `coverage ${Object.entries(report.coverage)
        .map(([l, c]) => `${l}: ${c}%`)
        .join(", ")}`,
    );
    for (const line of report.errors) console.error(`error ${line}`);
    return report.errors.length ? 1 : 0;
  }
  if (command === "check-literals") {
    const paths = positionals(rest);
    if (paths.length === 0) {
      console.error(USAGE);
      return 2;
    }
    const findings = checkLiterals(paths);
    for (const line of findings) console.error(`error ${line}`);
    console.log(
      findings.length
        ? `${findings.length} hardcoded string(s)`
        : "no hardcoded strings",
    );
    return findings.length ? 1 : 0;
  }
  console.error(USAGE);
  return 2;
}

process.exit(main(process.argv.slice(2)));
