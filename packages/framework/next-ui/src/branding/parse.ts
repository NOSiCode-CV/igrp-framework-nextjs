import type {
  IGRPBrandingLogos,
  IGRPBrandingLogoSlot,
  IGRPBrandingParseResult,
  IGRPBrandingTokenMap,
} from '@igrp/framework-next-types';

import { BRANDING_MAX_BYTES, isSafeCssValue, isSafeLogoUrl, isTokenName } from './validate.js';

type Tally = { dropped: number };
type Unknown = Record<string, unknown>;

const isRecord = (value: unknown): value is Unknown =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isPositiveInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

function cleanMap(input: unknown, tally: Tally): IGRPBrandingTokenMap {
  const out: IGRPBrandingTokenMap = {};
  if (!isRecord(input)) return out;
  for (const [name, value] of Object.entries(input)) {
    if (isTokenName(name) && typeof value === 'string' && isSafeCssValue(value)) {
      out[name] = value.trim();
    } else {
      tally.dropped += 1;
    }
  }
  return out;
}

function cleanSlot(input: unknown, tally: Tally, sized: boolean): IGRPBrandingLogoSlot | undefined {
  if (input === undefined) return undefined;
  if (!isRecord(input) || typeof input.light !== 'string' || !isSafeLogoUrl(input.light)) {
    tally.dropped += 1;
    return undefined;
  }
  const slot: IGRPBrandingLogoSlot = { light: input.light };
  if (input.dark !== undefined) {
    if (typeof input.dark === 'string' && isSafeLogoUrl(input.dark)) slot.dark = input.dark;
    else tally.dropped += 1;
  }
  if (sized) {
    if (isPositiveInt(input.width)) slot.width = input.width;
    if (isPositiveInt(input.height)) slot.height = input.height;
  }
  return slot;
}

/**
 * Parses a stored Brand document. Never throws: an unusable document yields
 * `branding: null`, and a bad field is dropped and counted.
 */
export function igrpParseBranding(raw: string): IGRPBrandingParseResult {
  if (new TextEncoder().encode(raw).byteLength > BRANDING_MAX_BYTES) {
    return { branding: null, dropped: 0 };
  }
  let doc: unknown;
  try {
    doc = JSON.parse(raw);
  } catch {
    return { branding: null, dropped: 0 };
  }
  if (!isRecord(doc) || doc.version !== 1) return { branding: null, dropped: 0 };

  const tally: Tally = { dropped: 0 };
  const tokens = isRecord(doc.tokens) ? doc.tokens : {};
  const logosIn = isRecord(doc.logos) ? doc.logos : {};
  const logos: IGRPBrandingLogos = {};
  for (const key of ['header', 'wide', 'favicon'] as const) {
    const slot = cleanSlot(logosIn[key], tally, key === 'wide');
    if (slot) logos[key] = slot;
  }

  return {
    branding: {
      version: 1,
      tokens: { light: cleanMap(tokens.light, tally), dark: cleanMap(tokens.dark, tally) },
      logos,
    },
    dropped: tally.dropped,
  };
}
