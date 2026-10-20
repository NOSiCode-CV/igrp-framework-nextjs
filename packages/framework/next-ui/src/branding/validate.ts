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

/**
 * Parentheses never go below zero, close exactly once at the last character,
 * and so form one outer call. An unclosed `(` would make the CSS tokenizer
 * swallow every following declaration and the dark block into this value.
 */
function isSingleBalancedCall(value: string): boolean {
  if (!value.includes('(')) return !value.includes(')');
  let depth = 0;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth < 0) return false;
      if (depth === 0 && i !== value.length - 1) return false;
    }
  }
  return depth === 0;
}

export function isTokenName(name: string): boolean {
  return TOKEN_NAME.test(name);
}

export function isSafeCssValue(value: string): boolean {
  const v = value.trim();
  return (
    v.length > 0 &&
    v.length <= MAX_VALUE_LENGTH &&
    !FORBIDDEN.test(v) &&
    COLOR.test(v) &&
    isSingleBalancedCall(v)
  );
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
