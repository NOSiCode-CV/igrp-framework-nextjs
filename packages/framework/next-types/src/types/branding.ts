/** Which palette a Brand token value applies to. */
export type IGRPBrandingMode = 'light' | 'dark';

/** Token name (for example `--primary`) to CSS value, for one Mode. Sparse: a missing key keeps the Default. */
export type IGRPBrandingTokenMap = Record<string, string>;

export interface IGRPBrandingTokens {
  light?: IGRPBrandingTokenMap;
  dark?: IGRPBrandingTokenMap;
}

export interface IGRPBrandingLogoSlot {
  /** Absolute http(s) URL of the light image. */
  light: string;
  /** Optional dark image; falls back to `light` when absent. */
  dark?: string;
  /** Intrinsic width in CSS px. Meaningful on the `wide` slot only. */
  width?: number;
  /** Intrinsic height in CSS px. Meaningful on the `wide` slot only. */
  height?: number;
}

export interface IGRPBrandingLogos {
  header?: IGRPBrandingLogoSlot;
  wide?: IGRPBrandingLogoSlot;
  favicon?: IGRPBrandingLogoSlot;
}

/** The organization Brand document, after validation. */
export interface IGRPBranding {
  version: 1;
  tokens: IGRPBrandingTokens;
  logos: IGRPBrandingLogos;
}

export type IGRPBrandingTokenGroup =
  'brand' | 'surface' | 'text' | 'status' | 'sidebar' | 'chart' | 'other';

export interface IGRPBrandingTokenCatalogEntry {
  name: string;
  group: IGRPBrandingTokenGroup;
}

/** Result of parsing a stored Brand document. `dropped` counts the fields removed. */
export interface IGRPBrandingParseResult {
  branding: IGRPBranding | null;
  dropped: number;
}
