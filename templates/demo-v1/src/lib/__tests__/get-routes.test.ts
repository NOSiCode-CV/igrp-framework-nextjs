import fs from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Shape of the `routes.d.ts` that Next.js generates for `typedRoutes: true`.
const ROUTES_DTS = `type AppRoutes = "/" | "/users" | "/users/[id]"
type PageRoutes = "/"
interface ParamMap {
  "/": {}
  "/users/[id]": { "id": string; }
}
export type ParamsOf<Route> = Route
`;

// The module caches its result, so each test loads a fresh copy.
async function load() {
  vi.resetModules();
  return (await import("../config/get-routes")).getRoutes;
}

let read: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  read = vi.spyOn(fs, "readFileSync");
  error = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("getRoutes", () => {
  it("extracts the app routes and the ParamMap body", async () => {
    read.mockReturnValue(ROUTES_DTS);
    const result = (await load())();
    expect(result?.appRoutes).toEqual(["/", "/users", "/users/[id]"]);
    expect(result?.paramMapBody).toContain('"/users/[id]": { "id": string; }');
    expect(error).not.toHaveBeenCalled();
  });

  it("reads .next/types/routes.d.ts under the working directory", async () => {
    read.mockReturnValue(ROUTES_DTS);
    (await load())();
    expect(String(read.mock.calls[0][0]).replace(/\\/g, "/")).toMatch(
      /\.next\/types\/routes\.d\.ts$/,
    );
  });

  it("returns undefined and logs when the file is missing", async () => {
    read.mockImplementation(() => {
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    });
    expect((await load())()).toBeUndefined();
    expect(error).toHaveBeenCalledOnce();
  });

  it.each([
    ["AppRoutes is missing", ROUTES_DTS.replace("type AppRoutes", "type X")],
    [
      "ParamMap is missing",
      ROUTES_DTS.replace("interface ParamMap", "interface Y"),
    ],
  ])("returns undefined and logs when %s", async (_name, content) => {
    read.mockReturnValue(content);
    expect((await load())()).toBeUndefined();
    expect(error).toHaveBeenCalledOnce();
  });

  it("returns undefined when AppRoutes matches but holds no routes", async () => {
    read.mockReturnValue(ROUTES_DTS.replace(/"\/" \| .*\n/, '""\n'));
    expect((await load())()).toBeUndefined();
    expect(error).toHaveBeenCalledOnce();
  });

  it("caches a failure so it reads and logs only once", async () => {
    read.mockImplementation(() => {
      throw new Error("ENOENT");
    });
    const getRoutes = await load();
    getRoutes();
    getRoutes();
    expect(read).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
  });

  it("caches a success so it reads only once", async () => {
    read.mockReturnValue(ROUTES_DTS);
    const getRoutes = await load();
    expect(getRoutes()).toBe(getRoutes());
    expect(read).toHaveBeenCalledOnce();
  });
});
