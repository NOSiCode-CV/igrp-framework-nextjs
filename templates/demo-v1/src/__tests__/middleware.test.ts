import { NextRequest } from "next/server";

import {
  basePathCookieSuffix,
  staleAuthCookies,
} from "@igrp/framework-next-auth/cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Auth-off paths of the middleware that auth-bypass.test.ts doesn't pin:
// which paths are public, the callbackUrl loop guard, the logout backstop,
// security headers and the stale-cookie sweep. NODE_ENV and the basePath are
// read when the module loads, so each case imports a fresh copy.

const auth = vi.hoisted(() => ({
  getLoginRedirectUrl: () => new URL("http://app.test/login"),
  resolveAppUrl: (path: string) => new URL(path, "http://app.test"),
  getTokenFromRequest: vi.fn(async (): Promise<object | null> => null),
  isTokenExpiredOrFailed: vi.fn(() => false),
  isEndedByHostLogout: vi.fn(() => false),
}));
vi.mock("@/lib/auth-instance", () => ({ auth }));

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("../middleware");
}

const request = (path: string, cookies: Record<string, string> = {}) => {
  const req = new NextRequest(`http://app.test${path}`);
  for (const [name, value] of Object.entries(cookies))
    req.cookies.set(name, value);
  return req;
};

const location = (res: Response) => {
  const raw = res.headers.get("location");
  return raw ? new URL(raw) : null;
};

beforeEach(() => {
  vi.stubEnv("IGRP_PREVIEW_MODE", "");
  vi.stubEnv("AUTH_PROVIDER", "");
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
  auth.getTokenFromRequest.mockReset().mockResolvedValue(null);
  auth.isTokenExpiredOrFailed.mockReset().mockReturnValue(false);
  auth.isEndedByHostLogout.mockReset().mockReturnValue(false);
});
afterEach(() => vi.unstubAllEnvs());

describe("public paths", () => {
  it.each([
    "/login",
    "/login/x",
    "/logout",
    "/api/auth/session",
    "/api/health",
    "/api/csp-report",
    "/_next/static/chunk.js",
    "/favicon.ico",
    "/logo.svg",
    "/fonts/a.woff2",
  ])("%s passes without a token", async (path) => {
    const { middleware } = await load();
    const res = await middleware(request(path));
    expect(location(res)).toBeNull();
    expect(auth.getTokenFromRequest).not.toHaveBeenCalled();
  });

  it.each([
    ["dotted page route", "/users/john.doe"],
    ["asset-looking API route", "/api/reports/2026.pdf"],
    ["other API route", "/api/data"],
    ["prefix lookalike", "/loginx"],
    ["prefix lookalike", "/api/healthz"],
  ])("%s %s needs a token", async (_, path) => {
    const { middleware } = await load();
    const res = await middleware(request(path));
    expect(location(res)?.pathname).toBe("/login");
    expect(auth.getTokenFromRequest).toHaveBeenCalledOnce();
  });
});

describe("login redirect", () => {
  it("omits callbackUrl for /", async () => {
    const { middleware } = await load();
    const res = await middleware(request("/"));
    expect(location(res)?.searchParams.has("callbackUrl")).toBe(false);
  });

  it("keeps a protected path and its query as callbackUrl", async () => {
    const { middleware } = await load();
    const res = await middleware(request("/clientes?page=2"));
    expect(location(res)?.searchParams.get("callbackUrl")).toBe(
      "/clientes?page=2",
    );
  });

  it("drops an encoded protocol-relative path instead of reflecting it", async () => {
    const { middleware } = await load();
    const res = await middleware(request("/%2F%2Fevil.example"));
    expect(location(res)?.pathname).toBe("/login");
    expect(location(res)?.searchParams.has("callbackUrl")).toBe(false);
  });

  it("uses the framework origin, not the request's internal one", async () => {
    const { middleware } = await load();
    const res = await middleware(
      new NextRequest("http://10.0.0.5:3000/clientes"),
    );
    expect(location(res)?.origin).toBe("http://app.test");
  });

  it.each([
    [
      "an expired or failed token",
      () => auth.isTokenExpiredOrFailed.mockReturnValue(true),
    ],
    [
      "a token read error",
      () => auth.getTokenFromRequest.mockRejectedValue(new Error("boom")),
    ],
  ])("redirects on %s", async (_, arrange) => {
    auth.getTokenFromRequest.mockResolvedValue({ sub: "u" });
    arrange();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { middleware } = await load();
    const res = await middleware(request("/clientes"));
    expect(location(res)?.pathname).toBe("/login");
  });

  it("marks a session ended by another app's logout", async () => {
    auth.getTokenFromRequest.mockResolvedValue({ sub: "u" });
    auth.isEndedByHostLogout.mockReturnValue(true);
    const { middleware } = await load();
    const res = await middleware(request("/clientes"));
    expect(location(res)?.searchParams.get("reason")).toBe("session_ended");
  });
});

describe("logout_pending backstop", () => {
  it("forces /login with no callbackUrl, even with a live token", async () => {
    auth.getTokenFromRequest.mockResolvedValue({ sub: "u" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { middleware } = await load();
    const { LOGOUT_PENDING_COOKIE } = await import("../lib/logout-pending");
    const res = await middleware(
      request("/clientes", { [LOGOUT_PENDING_COOKIE]: "1" }),
    );
    expect(location(res)?.pathname).toBe("/login");
    expect(location(res)?.searchParams.has("callbackUrl")).toBe(false);
  });

  it("does not fire on /login, so completing the logout can't loop", async () => {
    const { middleware } = await load();
    const { LOGOUT_PENDING_COOKIE } = await import("../lib/logout-pending");
    const res = await middleware(
      request("/login", { [LOGOUT_PENDING_COOKIE]: "1" }),
    );
    expect(location(res)).toBeNull();
  });
});

describe("security headers", () => {
  it("sends none outside production", async () => {
    const { middleware } = await load({ NODE_ENV: "test" });
    const res = await middleware(request("/login"));
    expect(res.headers.get("x-frame-options")).toBeNull();
    expect(res.headers.get("content-security-policy-report-only")).toBeNull();
  });

  describe("in production", () => {
    const prod = {
      NODE_ENV: "production",
      IGRP_AUTH_ISSUER: "https://idp.test/realms/igrp",
      NEXT_PUBLIC_ALLOWED_DOMAINS: "cdn.test, img.test",
    };

    it("sets the fixed headers on pass-through and redirect alike", async () => {
      const { middleware } = await load(prod);
      for (const res of [
        await middleware(request("/login")),
        await middleware(request("/clientes")),
      ]) {
        expect(res.headers.get("x-content-type-options")).toBe("nosniff");
        expect(res.headers.get("x-frame-options")).toBe("DENY");
        expect(res.headers.get("x-xss-protection")).toBe("0");
        expect(res.headers.get("strict-transport-security")).toMatch(
          /^max-age=\d+; includeSubDomains$/,
        );
      }
    });

    it("builds the CSP with a per-request nonce, IdP form-action and image domains", async () => {
      const { middleware } = await load(prod);
      const res = await middleware(request("/login"));
      const csp = res.headers.get("content-security-policy-report-only") ?? "";
      const nonce = res.headers.get("x-middleware-request-x-nonce");

      expect(nonce).toBeTruthy();
      expect(csp).toContain(`script-src 'self' 'nonce-${nonce}'`);
      expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
      expect(csp).toContain("form-action 'self' https://idp.test;");
      expect(csp).toContain(
        "img-src 'self' data: https://cdn.test http://cdn.test https://img.test http://img.test",
      );
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("report-uri /api/csp-report");
      // Next reads the nonce for its own scripts from the request's policy.
      expect(
        res.headers.get(
          "x-middleware-request-content-security-policy-report-only",
        ),
      ).toBe(csp);

      const again = await middleware(request("/login"));
      expect(again.headers.get("x-middleware-request-x-nonce")).not.toBe(nonce);
    });

    it("omits the IdP from form-action when IGRP_AUTH_ISSUER is malformed", async () => {
      const { middleware } = await load({
        ...prod,
        IGRP_AUTH_ISSUER: "not a url",
      });
      const res = await middleware(request("/login"));
      expect(res.headers.get("content-security-policy-report-only")).toContain(
        "form-action 'self';",
      );
    });

    it("prefixes the report-uri with the basePath", async () => {
      const { middleware } = await load({
        ...prod,
        NEXT_PUBLIC_BASE_PATH: "/apps/demo",
      });
      const res = await middleware(request("/login"));
      expect(res.headers.get("content-security-policy-report-only")).toContain(
        "report-uri /apps/demo/api/csp-report",
      );
    });
  });
});

describe("stale auth cookies", () => {
  const BASE = "/apps/demo";
  const legacy = `next-auth.session-token${basePathCookieSuffix(BASE)}`;

  it("expires this app's previous-generation cookies on a redirect", async () => {
    const expected = staleAuthCookies(BASE, [legacy]).map((c) => c.name);
    expect(expected).toContain(legacy);

    const { middleware } = await load({ NEXT_PUBLIC_BASE_PATH: BASE });
    const res = await middleware(request("/clientes", { [legacy]: "old" }));
    const cleared = res.cookies.get(legacy);
    expect(cleared?.value).toBe("");
    expect(cleared?.maxAge ?? 0).toBeLessThanOrEqual(0);
  });

  it("touches nothing for a root-path app", async () => {
    const { middleware } = await load();
    const res = await middleware(
      request("/login", { "next-auth.session-token": "live" }),
    );
    expect(res.cookies.getAll()).toEqual([]);
  });
});
