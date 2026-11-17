import { HOST_LOGOUT_COOKIE } from "@igrp/framework-next-auth/cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setCookie: vi.fn(),
  requestHeaders: new Headers(),
  getAccessToken: vi.fn(),
  buildEndSessionUrl: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: mocks.setCookie }),
  headers: async () => mocks.requestHeaders,
}));
vi.mock("@/lib/auth", () => ({
  auth: { getAccessToken: mocks.getAccessToken },
}));
vi.mock("@igrp/framework-next-auth/oidc", () => ({
  buildEndSessionUrl: mocks.buildEndSessionUrl,
}));

const { markHostLogout, getLogoutUrl } = await import("../auth");

beforeEach(() => {
  vi.stubEnv("IGRP_PREVIEW_MODE", "");
  vi.stubEnv("AUTH_PROVIDER", "");
  mocks.setCookie.mockClear();
  mocks.getAccessToken.mockReset();
  mocks.buildEndSessionUrl.mockReset();
  mocks.requestHeaders = new Headers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("markHostLogout", () => {
  it("writes a host-wide, httpOnly, server-clock timestamp", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-17T12:00:00Z") });
    await markHostLogout();
    expect(mocks.setCookie).toHaveBeenCalledWith(
      HOST_LOGOUT_COOKIE,
      String(Date.parse("2026-11-17T12:00:00Z") / 1000),
      expect.objectContaining({ path: "/", httpOnly: true, sameSite: "lax" }),
    );
  });

  it("is Secure only on a secure request", async () => {
    await markHostLogout();
    expect(mocks.setCookie.mock.calls[0][2].secure).toBe(false);

    mocks.requestHeaders = new Headers({ "x-forwarded-proto": "https" });
    await markHostLogout();
    expect(mocks.setCookie.mock.calls[1][2].secure).toBe(true);
  });

  it("does nothing when auth is bypassed", async () => {
    vi.stubEnv("AUTH_PROVIDER", "none");
    await markHostLogout();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
});

describe("getLogoutUrl", () => {
  const redirectBack = "https://app.test/login";

  it("returns null without a session, before asking the IdP", async () => {
    mocks.getAccessToken.mockResolvedValue(null);
    await expect(getLogoutUrl(redirectBack)).resolves.toBeNull();
    expect(mocks.buildEndSessionUrl).not.toHaveBeenCalled();
  });

  it("hands the token and the redirect-back URL to the OIDC builder", async () => {
    const token = { accessToken: "a", idToken: "id" };
    mocks.getAccessToken.mockResolvedValue(token);
    mocks.buildEndSessionUrl.mockResolvedValue("https://idp.test/logout?x");
    await expect(getLogoutUrl(redirectBack)).resolves.toBe(
      "https://idp.test/logout?x",
    );
    expect(mocks.buildEndSessionUrl).toHaveBeenCalledWith(
      token,
      process.env,
      redirectBack,
    );
  });

  it("still builds a URL without an id_token, and warns", async () => {
    mocks.getAccessToken.mockResolvedValue({ accessToken: "a" });
    mocks.buildEndSessionUrl.mockResolvedValue("https://idp.test/logout");
    await expect(getLogoutUrl(redirectBack)).resolves.toBe(
      "https://idp.test/logout",
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("no idToken"),
    );
  });

  it("returns null when the IdP has no end_session_endpoint", async () => {
    mocks.getAccessToken.mockResolvedValue({ idToken: "id" });
    mocks.buildEndSessionUrl.mockResolvedValue(null);
    await expect(getLogoutUrl(redirectBack)).resolves.toBeNull();
  });
});
