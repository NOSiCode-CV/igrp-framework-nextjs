import { describe, expect, it } from "vitest";

import { parseEnabledLocales, pickDefaultLocale } from "../enabled-locales";

describe("parseEnabledLocales", () => {
  it("keeps every language when unset or empty", () => {
    expect(parseEnabledLocales(undefined)).toEqual(["pt", "en", "fr"]);
    expect(parseEnabledLocales(" ")).toEqual(["pt", "en", "fr"]);
  });

  it("normalises tags, drops unknown ones and duplicates", () => {
    expect(parseEnabledLocales(" PT-cv, xx ,en,pt")).toEqual(["pt", "en"]);
  });

  it("keeps every language when nothing valid is left", () => {
    expect(parseEnabledLocales("xx,de")).toEqual(["pt", "en", "fr"]);
  });
});

describe("pickDefaultLocale", () => {
  it("keeps the preferred language when enabled", () => {
    expect(pickDefaultLocale(["en", "pt"], "pt")).toBe("pt");
  });

  it("falls back to the first enabled language", () => {
    expect(pickDefaultLocale(["fr", "en"], "pt")).toBe("fr");
  });
});
