import { describe, expect, it } from 'vitest';

import { igrpParseBranding, isSafeCssValue, isSafeLogoUrl, isTokenName } from '../index.js';

describe('isTokenName', () => {
  it.each(['--primary', '--sidebar-active-foreground', '--a', '--chart-1', `--a${'b'.repeat(63)}`])(
    'accepts %s',
    (name) => {
      expect(isTokenName(name)).toBe(true);
    },
  );

  it.each([
    ['no leading dashes', 'primary'],
    ['one leading dash', '-primary'],
    ['bare dashes', '--'],
    ['uppercase', '--Primary'],
    ['digit first', '--1abc'],
    ['underscore', '--my_token'],
    ['space', '--a b'],
    ['declaration break', '--a;color:red'],
    ['rule break', '--a}body{'],
    ['trailing newline', '--primary\n'],
    ['over 66 chars', `--a${'b'.repeat(64)}`],
    ['empty', ''],
  ])('rejects %s', (_label, name) => {
    expect(isTokenName(name)).toBe(false);
  });
});

describe('isSafeCssValue', () => {
  it.each([
    '#fff',
    '#ffffff',
    '#ffffff80',
    'red',
    'transparent',
    'currentColor',
    'oklch(0.45 0.18 250)',
    'oklab(0.5 0.1 -0.1)',
    'rgb(0 0 0 / 50%)',
    'rgba(0, 0, 0, 0.5)',
    'hsl(210 40% 98%)',
    'lch(50% 30 120)',
    'color(display-p3 1 0 0)',
    'color-mix(in oklch, red 40%, blue)',
    'color-mix(in oklch, oklch(0.5 0.1 200) 40%, white)',
    '  #fff  ',
    'a'.repeat(128),
  ])('accepts %s', (value) => {
    expect(isSafeCssValue(value)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['over 128 chars', 'a'.repeat(129)],
    ['long function', `rgb(${'0 '.repeat(70)})`],
    ['declaration break', 'red;'],
    ['rule break-out', 'red;}body{'],
    ['rule break-out with payload', 'red;}body{background:blue'],
    ['url()', 'url(https://evil.example/x)'],
    ['url(javascript:)', 'url(javascript:alert(1))'],
    ['uppercase URL()', 'URL(x)'],
    ['url() nested in a color function', 'color-mix(in srgb, url(x), red)'],
    ['expression()', 'expression(alert(1))'],
    ['html tag', '</style><script>alert(1)</script>'],
    ['at-rule', '@import "x"'],
    ['css escape', '\\72 ed'],
    ['double quote', 'red"'],
    ['single quote', "red'"],
    ['comment', 'red/**/'],
    ['two keywords', 'red blue'],
    ['var()', 'var(--primary)'],
    ['unknown function', 'image-set(x)'],
    ['bad hex', '#ggg'],
    ['short hex', '#12'],
    ['long hex', '#123456789'],
    ['unclosed paren', 'rgb(0 0 0'],
    ['extra close paren', 'rgb(0 0 0))'],
    ['two calls', 'rgb(1)(2)'],
    ['trailing !important', 'red !important'],
  ])('rejects %s', (_label, value) => {
    expect(isSafeCssValue(value)).toBe(false);
  });
});

describe('isSafeLogoUrl', () => {
  it.each([
    'https://cdn.example/mark.png',
    'http://cdn.example/mark.png',
    'https://cdn.example:8443/a/b.svg?v=2#x',
    `https://cdn.example/${'a'.repeat(2048 - 'https://cdn.example/'.length)}`,
  ])('accepts %s', (url) => {
    expect(isSafeLogoUrl(url)).toBe(true);
  });

  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['uppercase JAVASCRIPT:', 'JAVASCRIPT:alert(1)'],
    ['data:', 'data:image/svg+xml;base64,PHN2Zz4='],
    ['file:', 'file:///etc/passwd'],
    ['ftp:', 'ftp://cdn.example/x.png'],
    ['relative path', '/logo.png'],
    ['protocol-relative', '//evil.example/x.png'],
    ['username', 'https://user@cdn.example/x.png'],
    ['username and password', 'https://user:pass@cdn.example/x.png'],
    ['inner space', 'https://cdn.example/a b.png'],
    ['leading tab', '\thttps://cdn.example/x.png'],
    ['trailing newline', 'https://cdn.example/x.png\n'],
    ['over 2048 chars', `https://cdn.example/${'a'.repeat(2049 - 'https://cdn.example/'.length)}`],
    ['empty', ''],
    ['not a url', 'logo'],
  ])('rejects %s', (_label, url) => {
    expect(isSafeLogoUrl(url)).toBe(false);
  });
});

describe('wrong types', () => {
  it.each([null, undefined, 42, true, ['red'], { toString: () => 'red' }])(
    'igrpParseBranding drops a non-string token value (%s) without throwing',
    (value) => {
      const result = igrpParseBranding(
        JSON.stringify({ version: 1, tokens: { light: { '--primary': value } }, logos: {} }),
      );
      expect(result.branding?.tokens.light).toEqual({});
      // JSON.stringify omits `undefined` entirely, so there is nothing to drop.
      expect(result.dropped).toBe(value === undefined ? 0 : 1);
    },
  );

  it.each([null, 42, ['https://cdn.example/x.png'], { href: 'https://cdn.example/x.png' }])(
    'igrpParseBranding drops a non-string logo url (%s) without throwing',
    (light) => {
      const result = igrpParseBranding(
        JSON.stringify({ version: 1, tokens: {}, logos: { header: { light } } }),
      );
      expect(result.branding?.logos.header).toBeUndefined();
      expect(result.dropped).toBe(1);
    },
  );

  it('isTokenName answers false for non-strings', () => {
    expect(isTokenName(null as unknown as string)).toBe(false);
    expect(isTokenName(42 as unknown as string)).toBe(false);
  });

  // Bug: exported validator calls `value.trim()` unguarded, so a JS caller passing null gets a TypeError, not `false`.
  it.fails('isSafeCssValue answers false for null instead of throwing', () => {
    expect(isSafeCssValue(null as unknown as string)).toBe(false);
  });

  // Bug: exported validator reads `url.length` unguarded, so a JS caller passing null gets a TypeError, not `false`.
  it.fails('isSafeLogoUrl answers false for null instead of throwing', () => {
    expect(isSafeLogoUrl(null as unknown as string)).toBe(false);
  });
});
