import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  currentPath: null as string | null,
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers(
      mocks.currentPath ? { "x-current-path": mocks.currentPath } : {},
    ),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/actions/igrp/layout", () => ({ configLayout: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
  PREVIEW_SESSION_STUB: { user: { name: "Preview" } },
}));

// React's `cache` memoises per request; outside a request each import gets a
// fresh module so one test's session never leaks into the next.
async function load() {
  vi.resetModules();
  return import("../dal");
}

beforeEach(() => {
  vi.stubEnv("IGRP_PREVIEW_MODE", "");
  vi.stubEnv("AUTH_PROVIDER", "");
  mocks.getSession.mockReset();
  mocks.redirect.mockClear();
  mocks.currentPath = null;
});
afterEach(() => vi.unstubAllEnvs());

describe("verifySession", () => {
  it("returns the stub without reading a session when auth is bypassed", async () => {
    vi.stubEnv("IGRP_PREVIEW_MODE", "true");
    const { verifySession } = await load();
    await expect(verifySession()).resolves.toEqual({
      user: { name: "Preview" },
    });
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it("returns the session when there is one", async () => {
    const session = { user: { name: "Ana" } };
    mocks.getSession.mockResolvedValue(session);
    const { verifySession } = await load();
    await expect(verifySession()).resolves.toBe(session);
  });

  it.each([
    [null, "/login"],
    ["/", "/login"],
    ["/clientes?page=2", "/login?callbackUrl=%2Fclientes%3Fpage%3D2"],
    ["//evil.example", "/login"],
    ["/logout", "/login"],
  ])(
    "with no session and x-current-path %s redirects to %s",
    async (path, to) => {
      mocks.getSession.mockResolvedValue(null);
      mocks.currentPath = path;
      const { verifySession } = await load();
      await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT");
      expect(mocks.redirect).toHaveBeenCalledWith(to);
    },
  );
});

describe("getAuthenticatedUser", () => {
  it("exposes id, name and email only — never tokens", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "u1", name: "Ana", email: "ana@example.test" },
      accessToken: "secret",
      refreshToken: "secret",
      error: "RefreshAccessTokenError",
    });
    const { getAuthenticatedUser } = await load();
    await expect(getAuthenticatedUser()).resolves.toEqual({
      id: "u1",
      name: "Ana",
      email: "ana@example.test",
    });
  });

  it("fills missing fields with empty strings", async () => {
    mocks.getSession.mockResolvedValue({ user: {} });
    const { getAuthenticatedUser } = await load();
    await expect(getAuthenticatedUser()).resolves.toEqual({
      id: "",
      name: "",
      email: "",
    });
  });
});
