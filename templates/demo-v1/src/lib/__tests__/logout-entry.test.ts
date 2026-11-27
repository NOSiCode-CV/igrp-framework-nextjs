import { describe, expect, it } from "vitest";

import { classifyLogoutEntry } from "../logout-entry";

const entry = (h: Record<string, string>) =>
  classifyLogoutEntry(new Headers({ host: "app.test", ...h }));

describe("classifyLogoutEntry", () => {
  it("auto-starts an in-app navigation", () => {
    expect(entry({ "sec-fetch-site": "same-origin" })).toBe("auto");
  });

  it("asks for confirmation from a sibling subdomain or another site", () => {
    expect(entry({ "sec-fetch-site": "same-site" })).toBe("confirm");
    expect(entry({ "sec-fetch-site": "cross-site" })).toBe("confirm");
  });

  it("ignores a same-origin Referer when Sec-Fetch-Site says cross-site", () => {
    expect(
      entry({
        "sec-fetch-site": "cross-site",
        referer: "http://app.test/x",
      }),
    ).toBe("confirm");
  });

  it("leaves a typed URL or bookmark to the session check", () => {
    expect(entry({ "sec-fetch-site": "none" })).toBe("auto-if-session-dead");
    expect(entry({})).toBe("auto-if-session-dead");
  });

  it("falls back to the Referer host without Sec-Fetch-Site", () => {
    expect(entry({ referer: "http://app.test/dashboard" })).toBe("auto");
    expect(entry({ referer: "https://evil.test/app.test" })).toBe("confirm");
    expect(entry({ referer: "not a url" })).toBe("confirm");
  });

  it("compares the Referer with the proxy's public host", () => {
    const h = { host: "pod:3000", "x-forwarded-host": "public.test" };
    expect(entry({ ...h, referer: "https://public.test/x" })).toBe("auto");
    expect(entry({ ...h, referer: "http://pod:3000/x" })).toBe("confirm");
  });
});
