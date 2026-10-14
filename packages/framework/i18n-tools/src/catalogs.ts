import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import {
  type MessageFormatElement,
  parse,
  TYPE,
} from "@formatjs/icu-messageformat-parser";

export interface CheckCatalogsOptions {
  /** Folder holding `<locale>.json` files. */
  dir: string;
  /** The complete catalog every other file is checked against. */
  defaultLocale: string;
  /** Top-level namespaces the framework ships; keys under them are reported as info. */
  frameworkNamespaces?: string[];
}

export interface CatalogReport {
  errors: string[];
  info: string[];
  /** Percentage of default-catalog keys present per locale. */
  coverage: Record<string, number>;
}

type Tree = { [key: string]: unknown };
const CAMEL = /^[a-z][a-zA-Z0-9]*$/;

function flatten(tree: Tree, prefix = ""): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [k, v] of flatten(value as Tree, path)) out.set(k, v);
    } else {
      out.set(path, value);
    }
  }
  return out;
}

/** Names and kinds of every ICU argument and tag, sorted; `undefined` when the message does not parse. */
function icuArguments(message: string): string[] | undefined {
  const names = new Set<string>();
  const visit = (elements: MessageFormatElement[]) => {
    for (const el of elements) {
      switch (el.type) {
        case TYPE.argument:
        case TYPE.number:
        case TYPE.date:
        case TYPE.time:
          names.add(`${el.value}:${TYPE[el.type]}`);
          break;
        case TYPE.select:
        case TYPE.plural:
          names.add(`${el.value}:${TYPE[el.type]}`);
          for (const option of Object.values(el.options)) visit(option.value);
          break;
        case TYPE.tag:
          names.add(`<${el.value}>`);
          visit(el.children);
          break;
        default:
          break;
      }
    }
  };
  try {
    visit(parse(message));
  } catch {
    return undefined;
  }
  return [...names].sort();
}

export function checkCatalogs(options: CheckCatalogsOptions): CatalogReport {
  const errors: string[] = [];
  const info: string[] = [];
  const coverage: Record<string, number> = {};
  const frameworkNamespaces = new Set(options.frameworkNamespaces ?? []);

  const defaultFile = join(options.dir, `${options.defaultLocale}.json`);
  if (!existsSync(defaultFile)) {
    return {
      errors: [
        `default catalog ${options.defaultLocale}.json not found in ${options.dir}`,
      ],
      info,
      coverage,
    };
  }
  const files = readdirSync(options.dir).filter((f) => f.endsWith(".json"));
  const catalogs = new Map<string, Map<string, unknown>>();
  for (const file of files) {
    const locale = basename(file, ".json");
    catalogs.set(
      locale,
      flatten(
        JSON.parse(readFileSync(join(options.dir, file), "utf8")) as Tree,
      ),
    );
  }
  const base = catalogs.get(options.defaultLocale)!;
  const baseArgs = new Map<string, string[] | undefined>();

  for (const [locale, flat] of catalogs) {
    for (const [key, value] of flat) {
      if (locale !== options.defaultLocale && !base.has(key)) {
        errors.push(
          `${locale}: orphan key "${key}" (missing from ${options.defaultLocale})`,
        );
      }
      if (typeof value !== "string") {
        errors.push(`${locale}: "${key}" is not a string`);
        continue;
      }
      for (const segment of key.split(".")) {
        if (!CAMEL.test(segment)) {
          errors.push(
            `${locale}: key segment "${segment}" is not camelCase (in "${key}")`,
          );
        }
      }
      const args = icuArguments(value);
      if (!args) {
        errors.push(`${locale}: invalid ICU in "${key}"`);
        continue;
      }
      if (locale === options.defaultLocale) {
        baseArgs.set(key, args);
        if (frameworkNamespaces.has(key.split(".")[0]!)) {
          info.push(`${locale}: "${key}" shadows a framework namespace`);
        }
      } else if (base.has(key)) {
        const expected =
          baseArgs.get(key) ?? icuArguments(String(base.get(key)));
        if (expected && JSON.stringify(expected) !== JSON.stringify(args)) {
          errors.push(
            `${locale}: arguments of "${key}" differ from ${options.defaultLocale} (${expected.join(", ")} vs ${args.join(", ")})`,
          );
        }
      }
    }
    const present = [...base.keys()].filter((k) => flat.has(k)).length;
    coverage[locale] =
      base.size === 0 ? 100 : Math.round((present / base.size) * 100);
  }
  return { errors, info, coverage };
}
