import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The two client-written markers the login/logout flow relies on: the silent
// SSO loop guard and the deferred-logout marker the middleware backstop reads.

async function load(basePath = "") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", basePath);
  return {
    sso: await import("../silent-sso"),
    logout: await import("../logout-pending"),
  };
}

let written: string[];
function stubBrowser(protocol = "https:") {
  written = [];
  vi.stubGlobal("window", { location: { protocol } });
  vi.stubGlobal("document", {
    set cookie(value: string) {
      written.push(value);
    },
  });
}

beforeEach(() => stubBrowser());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("shouldAttemptSilentSso", () => {
  it.each([
    [{ alreadyTried: false, error: undefined, providerId: "igrp-auth" }, true],
    [{ alreadyTried: true, error: undefined, providerId: "igrp-auth" }, false],
    [
      { alreadyTried: false, error: "Callback", providerId: "igrp-auth" },
      false,
    ],
    [{ alreadyTried: false, error: "", providerId: "igrp-auth" }, false],
    [{ alreadyTried: false, error: undefined, providerId: "none" }, false],
    [{ alreadyTried: false, error: undefined, providerId: "custom" }, false],
    [{ alreadyTried: false, error: undefined, providerId: undefined }, false],
  ])("%o → %s", async (input, expected) => {
    const { sso } = await load();
    expect(sso.shouldAttemptSilentSso(input)).toBe(expected);
  });
});

describe("silentSsoCallbackUrl", () => {
  it.each([
    [undefined, undefined],
    ["", undefined],
    [encodeURIComponent("/clientes?page=2"), "/clientes?page=2"],
    [encodeURIComponent("https://evil.example"), undefined],
    [encodeURIComponent("//evil.example"), undefined],
    ["%E0%A4%A", undefined],
  ])("%s → %s", async (cookie, expected) => {
    const { sso } = await load();
    expect(sso.silentSsoCallbackUrl(cookie)).toBe(expected);
  });

  it("round-trips what markSilentSsoTried wrote", async () => {
    const { sso } = await load();
    sso.markSilentSsoTried("/a b?x=1&y=2");
    const value = written[0].split(";")[0].split("=").slice(1).join("=");
    expect(sso.silentSsoCallbackUrl(value)).toBe("/a b?x=1&y=2");
  });
});

type Loaded = Awaited<ReturnType<typeof load>>;
const markers: [string, (m: Loaded) => void, (m: Loaded) => string][] = [
  [
    "silent SSO",
    (m) => m.sso.markSilentSsoTried(),
    (m) => m.sso.SILENT_SSO_COOKIE,
  ],
  [
    "logout pending",
    (m) => m.logout.markLogoutPending(),
    (m) => m.logout.LOGOUT_PENDING_COOKIE,
  ],
];

describe.each(markers)("%s marker", (_, mark, name) => {
  it("is SameSite=Lax, short-lived and Secure on https", async () => {
    mark(await load());
    expect(written[0]).toMatch(/; path=\/; max-age=\d+; samesite=lax; secure$/);
  });

  it("drops Secure on plain http, where the browser would discard it", async () => {
    stubBrowser("http:");
    mark(await load());
    expect(written[0]).not.toContain("secure");
  });

  it("is scoped to the basePath, by path and by name", async () => {
    const rootName = name(await load());
    const scoped = await load("/apps/demo");
    expect(name(scoped)).not.toBe(rootName);
    mark(scoped);
    expect(written[0]).toContain("; path=/apps/demo;");
  });
});

describe("clearLogoutPending", () => {
  it("expires the same cookie markLogoutPending set", async () => {
    const { logout } = await load("/apps/demo");
    logout.markLogoutPending();
    logout.clearLogoutPending();
    const [set, clear] = written;
    expect(clear.split("=")[0]).toBe(set.split("=")[0]);
    expect(clear).toContain("max-age=0");
    expect(clear).toContain("; path=/apps/demo;");
  });
});
