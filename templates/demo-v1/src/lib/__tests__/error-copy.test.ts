import { describe, expect, it } from "vitest";

import { hasPlatformCode, resolvePublicErrorCopy } from "@/lib/error-copy";

const fromServer = (digest: string) =>
  Object.assign(new Error("omitted"), { digest });

describe("hasPlatformCode", () => {
  it("sees a code on the error or in a server error digest", () => {
    expect(hasPlatformCode(Object.assign(new Error("x"), { code: "C" }))).toBe(
      true,
    );
    expect(hasPlatformCode(fromServer("m1-ab|IGRP_CONFIG_INVALID"))).toBe(true);
  });

  it("sees none on an AppError message, a Next hash or a plain error", () => {
    expect(hasPlatformCode(fromServer("m1-ab|Perfil indisponível."))).toBe(
      false,
    );
    expect(hasPlatformCode(fromServer("2384712"))).toBe(false);
    expect(hasPlatformCode(new Error("x"))).toBe(false);
  });
});

describe("resolvePublicErrorCopy", () => {
  it("shows an AppError message but never a code as text", () => {
    expect(
      resolvePublicErrorCopy(fromServer("m1-ab|Perfil indisponível.")),
    ).toEqual({ description: "Perfil indisponível." });
    expect(
      resolvePublicErrorCopy(fromServer("m1-ab|IGRP_CONFIG_INVALID")),
    ).toBeUndefined();
  });
});
