import { describe, expect, it } from "vitest"

import { isIconOnlySize } from "../button.js"

describe("isIconOnlySize", () => {
  it.each([
    ["icon", true],
    ["icon-xs", true],
    ["icon-sm", true],
    ["icon-lg", true],
    ["default", false],
    ["sm", false],
    ["xs", false],
    ["lg", false],
    [undefined, false],
    [null, false],
  ])("isIconOnlySize(%s) is %s", (size, expected) => {
    expect(isIconOnlySize(size as never)).toBe(expected)
  })
})
