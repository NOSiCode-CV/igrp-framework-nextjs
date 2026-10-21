import { checkCatalogs } from "./catalogs.js";
import { checkLiterals } from "./literals.js";

const USAGE = `igrp-i18n <command>

  check-catalogs <dir> --default <locale> [--framework-namespaces common,i18n,errors] [--allow-missing]
      Orphan keys, keys missing from a non-default locale, non-string values, empty translations, invalid ICU, argument mismatches,
      unused plural categories, camelCase segments.
      --allow-missing  report missing keys as coverage only
  check-literals <path...>
      Hardcoded user-facing strings and Intl/toLocale* locales in non-test .ts/.tsx files;
      next-intl formatter imports.
`;

const VALUE_FLAGS = new Set(["--default", "--framework-namespaces"]);
const BOOLEAN_FLAGS = new Set(["--allow-missing"]);

/** `--name value` or `--name=value`. */
function option(args: string[], name: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const hasUnknownFlag = (args: string[]) =>
  args.some((a) => {
    const name = a.split("=")[0]!;
    return a.startsWith("--") && !VALUE_FLAGS.has(name) && !BOOLEAN_FLAGS.has(name);
  });

/** Positional arguments: everything that is neither an option nor an option's value. */
function positionals(args: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      if (VALUE_FLAGS.has(arg)) i += 1;
      continue;
    }
    out.push(arg);
  }
  return out;
}

function run(argv: string[]): number {
  const [command, ...rest] = argv;
  if (hasUnknownFlag(rest)) {
    console.error(USAGE);
    return 2;
  }
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
      allowMissing: rest.includes("--allow-missing"),
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

// Kept apart from cli.ts so tests can import it without process.exit running.
export function main(argv: string[]): number {
  try {
    return run(argv);
  } catch (e) {
    console.error(`error ${(e as Error).message}`);
    return 2;
  }
}
