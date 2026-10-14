import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const USER_FACING_PROPS = new Set([
  "placeholder",
  "title",
  "label",
  "aria-label",
  "aria-description",
  "description",
  "alt",
  "helperText",
  "errorText",
  "searchText",
  "selectLabel",
]);
const HAS_LETTER = /\p{L}/u;
const FORMATTER_IMPORTS = new Set(["useFormatter", "getFormatter"]);

function literalText(node: ts.Node | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isTemplateExpression(node)) {
    return [
      node.head.text,
      ...node.templateSpans.map((s) => s.literal.text),
    ].join(" ");
  }
  if (ts.isParenthesizedExpression(node)) return literalText(node.expression);
  return undefined;
}

/** `line: finding` for every hardcoded user-facing string or formatter import in `source`. */
export function findLiteralStrings(
  source: string,
  fileName = "x.tsx",
): string[] {
  const sf = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const findings: string[] = [];
  const line = (node: ts.Node) =>
    sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const report = (node: ts.Node, what: string) =>
    findings.push(`${line(node)}: ${what}`);

  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      /^next-intl(\/server)?$/.test(node.moduleSpecifier.text)
    ) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const el of bindings.elements) {
          const name = (el.propertyName ?? el.name).text;
          if (FORMATTER_IMPORTS.has(name)) {
            report(
              node,
              `import of ${name} from next-intl (use useIGRPFormat / igrpFormatDate)`,
            );
          }
        }
      }
    }
    if (ts.isJsxText(node)) {
      const text = node.getText(sf).trim();
      if (HAS_LETTER.test(text)) report(node, `JSX text "${text}"`);
    }
    if (
      ts.isJsxExpression(node) &&
      node.parent &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
    ) {
      const text = literalText(node.expression);
      if (text !== undefined && HAS_LETTER.test(text))
        report(node, `literal child "${text}"`);
    }
    if (
      ts.isJsxAttribute(node) &&
      USER_FACING_PROPS.has(node.name.getText(sf))
    ) {
      const init = node.initializer;
      const text =
        init && ts.isJsxExpression(init)
          ? literalText(init.expression)
          : literalText(init);
      if (text !== undefined && HAS_LETTER.test(text)) {
        report(node, `literal prop ${node.name.getText(sf)}="${text}"`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return findings;
}

function listTsxFiles(path: string): string[] {
  const stat = statSync(path);
  if (stat.isFile())
    return path.endsWith(".tsx") && !/\.test\.tsx$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap((name) => listTsxFiles(join(path, name)));
}

/** Findings as `relative/path.tsx:line: what`, for every non-test `.tsx` under `paths`. */
export function checkLiterals(paths: string[], cwd = process.cwd()): string[] {
  return paths.flatMap((p) =>
    listTsxFiles(p).flatMap((file) =>
      findLiteralStrings(readFileSync(file, "utf8"), file).map(
        (f) => `${relative(cwd, file).replaceAll("\\", "/")}:${f}`,
      ),
    ),
  );
}
