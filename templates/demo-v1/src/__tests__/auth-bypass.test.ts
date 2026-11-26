import { NextRequest } from "next/server";

import {
  isAuthDisabled,
  isPreviewModeEnabled,
} from "@igrp/framework-next-auth/providers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Every auth-aware path must behave with bypass on (IGRP_PREVIEW_MODE=true or
// AUTH_PROVIDER=none) and off. These pin the middleware and session args to it.

const auth = vi.hoisted(() => ({
  getLoginRedirectUrl: () => new URL("http://localhost/login"),
  resolveAppUrl: (path: string) => new URL(path, "http://localhost"),
  getTokenFromRequest: vi.fn(async (): Promise<object | null> => null),
  isTokenExpiredOrFailed: () => false,
  isEndedByHostLogout: () => false,
  // Like the withIGRPAuth instance: the real env predicates, read per call.
  isPreviewMode: () => isPreviewModeEnabled(process.env),
  isAuthDisabled: () => isAuthDisabled(process.env),
}));
vi.mock("@/lib/auth-instance", () => ({ auth }));

const { middleware } = await import("../middleware");
const { isAuthBypass } = await import("../lib/utilities");
const { getSessionArgs } = await import("../lib/config/get-session-args");

const request = (path: string) => new NextRequest(`http://localhost${path}`);

beforeEach(() => {
  vi.stubEnv("IGRP_PREVIEW_MODE", "");
  vi.stubEnv("AUTH_PROVIDER", "");
  auth.getTokenFromRequest.mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());

describe("isAuthBypass", () => {
  it.each([
    ["IGRP_PREVIEW_MODE", "true"],
    ["IGRP_PREVIEW_MODE", ' "TRUE" '],
    ["AUTH_PROVIDER", "none"],
    ["AUTH_PROVIDER", "'None'"],
  ])("is on for %s=%s", (key, value) => {
    vi.stubEnv(key, value);
    expect(isAuthBypass()).toBe(true);
  });

  it("is off otherwise", () => {
    vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
    expect(isAuthBypass()).toBe(false);
  });
});

describe.each([
  ["IGRP_PREVIEW_MODE", "true"],
  ["AUTH_PROVIDER", "none"],
])("bypass on (%s=%s)", (key, value) => {
  beforeEach(() => vi.stubEnv(key, value));

  it.each(["/login", "/logout", "/api/auth/session"])(
    "sends %s to /",
    async (path) => {
      const response = await middleware(request(path));
      expect(response.headers.get("location")).toBe("http://localhost/");
    },
  );

  it("lets a protected page through without asking for a token", async () => {
    const response = await middleware(request("/clientes"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-current-path")).toBe(
      "/clientes",
    );
    expect(auth.getTokenFromRequest).not.toHaveBeenCalled();
  });

  it("turns session refetch off", () => {
    expect(getSessionArgs().refetchInterval).toBe(0);
  });
});

describe("bypass off", () => {
  it("redirects a protected page without a session to /login with the callbackUrl", async () => {
    const response = await middleware(request("/clientes?page=2"));
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/clientes?page=2");
  });

  it("lets a protected page through with a valid token", async () => {
    auth.getTokenFromRequest.mockResolvedValue({ sub: "user" });
    const response = await middleware(request("/clientes"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("serves /login without a token", async () => {
    const response = await middleware(request("/login"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps the session refetch backstop", () => {
    expect(getSessionArgs().refetchInterval).toBeGreaterThan(0);
  });
});
