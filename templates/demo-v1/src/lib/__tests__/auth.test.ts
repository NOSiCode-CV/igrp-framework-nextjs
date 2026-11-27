import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  serverSession: vi.fn(),
  getSession: vi.fn(),
  ensureConfig: vi.fn(),
  assertEnv: vi.fn(),
  isControlFlow: vi.fn((_e: unknown) => false),
  isIgrpError: vi.fn((_e: unknown) => false),
  reportError: vi.fn(),
  isAuthBypass: vi.fn(() => false),
}));

vi.mock("@igrp/framework-next", () => ({
  igrpEnsureAccessClientConfig: mocks.ensureConfig,
}));
vi.mock("@igrp/framework-next/errors", () => ({
  isIgrpError: mocks.isIgrpError,
}));
vi.mock("@igrp/framework-next-auth/providers", () => ({
  assertAuthProviderEnv: mocks.assertEnv,
}));
vi.mock("@igrp/framework-next-auth/runtime", () => ({
  isNextControlFlowError: mocks.isControlFlow,
}));
vi.mock("@/lib/auth-instance", () => ({
  auth: { serverSession: mocks.serverSession, getSession: mocks.getSession },
  PREVIEW_SESSION_STUB: {},
}));
vi.mock("@/lib/report-error", () => ({ reportError: mocks.reportError }));
vi.mock("@/lib/utilities", () => ({ isAuthBypass: mocks.isAuthBypass }));

import { getSession, serverSession } from "../auth";

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.isControlFlow.mockReturnValue(false);
  mocks.isIgrpError.mockReturnValue(false);
  mocks.isAuthBypass.mockReturnValue(false);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("serverSession", () => {
  it("validates the provider env before reading the session", async () => {
    mocks.assertEnv.mockImplementation(() => {
      throw new Error("bad env");
    });
    await expect(serverSession()).rejects.toThrow("bad env");
    expect(mocks.serverSession).not.toHaveBeenCalled();
  });

  it("seeds the access client with the session token", async () => {
    const session = { accessToken: "tok" };
    mocks.serverSession.mockResolvedValue(session);
    await expect(serverSession()).resolves.toBe(session);
    expect(mocks.ensureConfig).toHaveBeenCalledWith({ token: "tok" });
  });

  it("seeds an empty token when the session has none", async () => {
    mocks.serverSession.mockResolvedValue({});
    await serverSession();
    expect(mocks.ensureConfig).toHaveBeenCalledWith({ token: "" });
  });

  it("does not seed a token the session marks as failed", async () => {
    const session = { accessToken: "dead", error: "RefreshAccessTokenError" };
    mocks.serverSession.mockResolvedValue(session);
    await expect(serverSession()).resolves.toBe(session);
    expect(mocks.ensureConfig).not.toHaveBeenCalled();
  });

  it("returns null without seeding when there is no session", async () => {
    mocks.serverSession.mockResolvedValue(null);
    await expect(serverSession()).resolves.toBeNull();
    expect(mocks.ensureConfig).not.toHaveBeenCalled();
  });

  it("swallows a cookie-decode failure as no session and reports it", async () => {
    const error = new Error("JWEDecryptionFailed");
    mocks.serverSession.mockRejectedValue(error);
    await expect(serverSession()).resolves.toBeNull();
    expect(mocks.reportError).toHaveBeenCalledWith(error, {
      segment: "lib/auth.serverSession",
    });
  });

  it("rethrows Next.js control-flow errors without reporting them", async () => {
    const bailout = new Error("DYNAMIC_SERVER_USAGE");
    mocks.serverSession.mockRejectedValue(bailout);
    mocks.isControlFlow.mockImplementation((e) => e === bailout);
    await expect(serverSession()).rejects.toBe(bailout);
    expect(mocks.reportError).not.toHaveBeenCalled();
  });

  it("rethrows typed IGRP errors", async () => {
    const error = new Error("igrp");
    mocks.serverSession.mockRejectedValue(error);
    mocks.isIgrpError.mockImplementation((e) => e === error);
    await expect(serverSession()).rejects.toBe(error);
    expect(mocks.reportError).not.toHaveBeenCalled();
  });

  it("rethrows IGRPAuthConfigError", async () => {
    const error = Object.assign(new Error("AUTH_SECRET_MISSING"), {
      name: "IGRPAuthConfigError",
    });
    mocks.serverSession.mockRejectedValue(error);
    await expect(serverSession()).rejects.toBe(error);
  });

  it("treats a failure while seeding the token as no session", async () => {
    mocks.serverSession.mockResolvedValue({ accessToken: "tok" });
    mocks.ensureConfig.mockRejectedValue(new Error("store"));
    await expect(serverSession()).resolves.toBeNull();
    expect(mocks.reportError).toHaveBeenCalled();
  });
});

describe("getSession", () => {
  it("returns null without reading a session when auth is bypassed", async () => {
    mocks.isAuthBypass.mockReturnValue(true);
    await expect(getSession()).resolves.toBeNull();
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it("seeds the access client and returns the session", async () => {
    const session = { accessToken: "tok" };
    mocks.getSession.mockResolvedValue(session);
    await expect(getSession()).resolves.toBe(session);
    expect(mocks.ensureConfig).toHaveBeenCalledWith({ token: "tok" });
  });

  it("returns null without seeding when there is no session", async () => {
    mocks.getSession.mockResolvedValue(null);
    await expect(getSession()).resolves.toBeNull();
    expect(mocks.ensureConfig).not.toHaveBeenCalled();
  });
});
