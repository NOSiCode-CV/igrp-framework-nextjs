/**
 * Guards the two properties of the Babel build that nothing else notices when
 * they break: the React Compiler actually memoizing, and the production JSX
 * runtime actually being emitted.
 *
 * Both have failed silently before, under @babel/core 8:
 * `babel-plugin-react-compiler` swallows a lowering error per function and emits
 * the original code, and `@babel/preset-react` 8 picks its JSX runtime from
 * `api.env()`. In each case the build stays green, the tests stay green, and the
 * published package is simply slower. The only way to catch that is to assert on
 * the emitted output.
 *
 * On the pinned Babel 7 toolchain the JSX assertion cannot fail — `development`
 * already defaults to false there. It is here to fail the moment someone moves
 * this repo to Babel 8 without carrying the pin across.
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { transformSync } from "@babel/core"
import { describe, expect, it } from "vitest"

import { createBabelConfig, createReactCompilerConfig } from "../../../scripts/react-compiler-babel-config.cjs"

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const srcRoot = path.join(packageRoot, "src")

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourceFiles(full)
    if (!/\.tsx?$/.test(entry.name)) return []
    if (/\.test\.tsx?$|\.d\.ts$/.test(entry.name)) return []
    return [full]
  })
}

const babelOptions = (createBabelConfig() as (api: unknown) => Record<string, unknown>)({
  cache: () => {},
  env: () => "test",
})

/** Runs the real build config over one file and reports what the compiler did with it. */
function compile(file: string, envName?: string) {
  const bailouts: string[] = []
  const options = {
    ...babelOptions,
    filename: file,
    configFile: false,
    babelrc: false,
    plugins: [
      [
        "babel-plugin-react-compiler",
        {
          ...createReactCompilerConfig(),
          logger: {
            logEvent(_fn: string, event: { kind: string; detail?: { reason?: string; description?: string } }) {
              if (event.kind === "CompileSuccess") return
              bailouts.push(event.detail?.reason ?? event.detail?.description ?? event.kind)
            },
          },
        },
      ],
    ],
  }

  const output = transformSync(readFileSync(file, "utf8"), envName ? { ...options, envName } : options)?.code ?? ""
  return { bailouts, code: output }
}

describe("babel build pipeline", () => {
  const clientModules = sourceFiles(srcRoot).filter((file) => createReactCompilerConfig().sources(file))

  // One pass over the package, shared by the assertions below — compiling ~120
  // modules takes well past the default 5s per-test budget.
  let compiled: ReturnType<typeof compile>[] | undefined
  const compileAll = () => (compiled ??= clientModules.map((file) => ({ file, ...compile(file) })))

  it("has client modules to compile", () => {
    expect(clientModules.length).toBeGreaterThan(100)
  })

  it("emits the production JSX runtime even with NODE_ENV unset", () => {
    // `development` follows `api.env()` unless it is pinned, and the build
    // scripts set no NODE_ENV — so this is what stops the dev runtime shipping.
    const withJsx = clientModules.find((file) => file.endsWith("button.tsx"))
    expect(withJsx).toBeDefined()

    // `envName: "development"` is what Babel resolves to when no NODE_ENV or
    // BABEL_ENV is set — exactly how `pnpm build:js` invokes it. Vitest sets
    // NODE_ENV=test, under which even Babel 8 emits the production runtime, so
    // asserting in the ambient env would prove nothing.
    const { code } = compile(withJsx as string, "development")
    expect(code).toContain("react/jsx-runtime")
    expect(code).not.toContain("react/jsx-dev-runtime")
  })

  it("memoizes the bulk of the client modules", { timeout: 120_000 }, () => {
    const memoized = compileAll().filter((r) => r.code.includes("compiler-runtime"))

    // Not every client module has something to memoize (pure pass-throughs do
    // not), so this is a floor, not a target. It exists to catch a toolchain
    // change that drops the number off a cliff — @babel/core 8 took it to 67.
    expect(memoized.length).toBeGreaterThanOrEqual(100)
  })

  it("has no widespread compiler bailouts", { timeout: 120_000 }, () => {
    const failing = compileAll().filter((r) => r.bailouts.length > 0)

    // A handful of components hit genuine compiler limitations. A toolchain
    // mismatch shows up as dozens of files failing with the same message.
    const byReason = new Map<string, number>()
    for (const result of failing) {
      for (const reason of result.bailouts) byReason.set(reason, (byReason.get(reason) ?? 0) + 1)
    }
    const worst = [...byReason.values()].sort((a, b) => b - a)[0] ?? 0

    expect(failing.length).toBeLessThan(15)
    expect(worst).toBeLessThan(15)
  })
})
