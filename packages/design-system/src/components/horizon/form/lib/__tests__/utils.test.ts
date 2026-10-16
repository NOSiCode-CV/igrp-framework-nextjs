import { describe, expect, it } from "vitest"

import { convertValuesToFormData } from "../utils.js"

describe("convertValuesToFormData", () => {
  it("keeps files binary, one entry per file, for single files, arrays and FileLists", () => {
    const a = new File(["a"], "a.txt")
    const b = new File(["b"], "b.txt")
    const dt = { 0: a, 1: b, length: 2, item: (i: number) => [a, b][i] ?? null }
    Object.setPrototypeOf(dt, FileList.prototype)

    const fd = convertValuesToFormData({ one: a, many: [a, b], list: dt as unknown as FileList })

    expect(fd.get("one")).toBeInstanceOf(File)
    expect(fd.getAll("many").map((f) => (f as File).name)).toEqual(["a.txt", "b.txt"])
    expect(fd.getAll("list").map((f) => (f as File).name)).toEqual(["a.txt", "b.txt"])
  })

  it("serialises nested objects and list rows as JSON, primitives as strings, and skips nullish", () => {
    const fd = convertValuesToFormData({
      address: { city: "Praia" },
      contacts: [{ name: "Ana" }],
      tags: ["x", "y"],
      active: false,
      empty: null,
      missing: undefined,
    })

    expect(fd.get("address")).toBe('{"city":"Praia"}')
    expect(fd.getAll("contacts")).toEqual(['{"name":"Ana"}'])
    expect(fd.getAll("tags")).toEqual(["x", "y"])
    expect(fd.get("active")).toBe("false")
    expect(fd.has("empty")).toBe(false)
    expect(fd.has("missing")).toBe(false)
  })
})
