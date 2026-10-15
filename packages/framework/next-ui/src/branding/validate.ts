/** Maximum size of a stored Brand document, in UTF-8 bytes. */
export const BRANDING_MAX_BYTES = 64 * 1024;

const TOKEN_NAME = /^--[a-z][a-z0-9-]{0,63}$/;
/** Characters that could end a declaration or open a new rule, plus functions that load resources. */
const FORBIDDEN = /[;{}<>@\\]|url\(|expression\(/i;
/** One concrete color, a named keyword, or a color function whose arguments are plain. */
const COLOR =
  /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|color|color-mix)\([0-9a-z%.,\s/+\-#()]*\)|transparent|currentcolor|[a-z]+)$/i;
const MAX_VALUE_LENGTH = 128;
const MAX_URL_LENGTH = 2048;

export function isTokenName(name: string): boolean {
  return TOKEN_NAME.test(name);
}

export function isSafeCssValue(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && v.length <= MAX_VALUE_LENGTH && !FORBIDDEN.test(v) && COLOR.test(v);
}

export function isSafeLogoUrl(url: string): boolean {
  if (url.length > MAX_URL_LENGTH || /\s/.test(url)) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}
