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
  "text",
  "message",
  "emptyText",
]);
const LOCALE_METHODS = new Set([
  "toLocaleString",
  "toLocaleDateString",
  "toLocaleTimeString",
]);
const HAS_LETTER = /\p{L}/u;
// `&mdash;`, `&nbsp;`, `&#8594;`: entity names carry letters but render as symbols.
const HTML_ENTITY = /&(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);/g;
const hasLetter = (text: string) =>
  HAS_LETTER.test(text.replace(HTML_ENTITY, ""));
const FORMATTER_IMPORTS = new Set(["useFormatter", "getFormatter"]);

/** Every string a node can render: through ternaries, `&&` (right side only) and `||`/`??`. */
function literalTexts(node: ts.Node | undefined): string[] {
  if (!node) return [];
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return [node.text];
  if (ts.isTemplateExpression(node)) {
    return [
      [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(
        " ",
      ),
    ];
  }
  if (ts.isParenthesizedExpression(node)) return literalTexts(node.expression);
  if (ts.isConditionalExpression(node))
    return [...literalTexts(node.whenTrue), ...literalTexts(node.whenFalse)];
  if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    if (op === ts.SyntaxKind.AmpersandAmpersandToken)
      return literalTexts(node.right);
    if (
      op === ts.SyntaxKind.BarBarToken ||
      op === ts.SyntaxKind.QuestionQuestionToken
    )
      return [...literalTexts(node.left), ...literalTexts(node.right)];
  }
  return [];
}

/** The locale tag of `new Intl.X("tag")` or `.toLocale*String("tag")`, if hardcoded. */
function hardcodedLocale(node: ts.Node): string | undefined {
  let arg: ts.Expression | undefined;
  if (
    ts.isNewExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === "Intl"
  ) {
    arg = node.arguments?.[0];
  } else if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    LOCALE_METHODS.has(node.expression.name.text)
  ) {
    arg = node.arguments[0];
  }
  return arg &&
    (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))
    ? arg.text
    : undefined;
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
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
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
      if (hasLetter(text)) report(node, `JSX text "${text}"`);
    }
    if (
      ts.isJsxExpression(node) &&
      node.parent &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
    ) {
      for (const text of literalTexts(node.expression)) {
        if (HAS_LETTER.test(text)) report(node, `literal child "${text}"`);
      }
    }
    if (
      ts.isJsxAttribute(node) &&
      USER_FACING_PROPS.has(node.name.getText(sf))
    ) {
      const init = node.initializer;
      const texts = literalTexts(
        init && ts.isJsxExpression(init) ? init.expression : init,
      );
      for (const text of texts) {
        if (HAS_LETTER.test(text)) {
          report(node, `literal prop ${node.name.getText(sf)}="${text}"`);
        }
      }
    }
    const locale = hardcodedLocale(node);
    if (locale !== undefined)
      report(node, `hardcoded locale "${locale}": use useIGRPFormat`);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return findings;
}

function listSourceFiles(path: string): string[] {
  const stat = statSync(path);
  if (stat.isFile())
    return /\.tsx?$/.test(path) && !/\.(test|d)\.tsx?$/.test(path)
      ? [path]
      : [];
  return readdirSync(path).flatMap((name) => listSourceFiles(join(path, name)));
}

/** Findings as `relative/path:line: what`, for every non-test, non-declaration `.ts`/`.tsx` under `paths`. */
export function checkLiterals(paths: string[], cwd = process.cwd()): string[] {
  return paths.flatMap((p) =>
    listSourceFiles(p).flatMap((file) =>
      findLiteralStrings(readFileSync(file, "utf8"), file).map(
        (f) => `${relative(cwd, file).replaceAll("\\", "/")}:${f}`,
      ),
    ),
  );
}
