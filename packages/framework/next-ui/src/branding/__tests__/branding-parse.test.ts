import { describe, expect, it } from 'vitest';

import { BRANDING_MAX_BYTES, igrpParseBranding } from '../index.js';

const doc = (body: unknown) => JSON.stringify(body);

describe('igrpParseBranding', () => {
  it('parses a valid document without dropping anything', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: { light: { '--primary': 'oklch(0.45 0.18 250)' }, dark: { '--primary': 'oklch(0.78 0.14 250)' } },
        logos: { header: { light: 'https://cdn.example/mark.png' } },
      }),
    );
    expect(result.dropped).toBe(0);
    expect(result.branding?.tokens.light).toEqual({ '--primary': 'oklch(0.45 0.18 250)' });
    expect(result.branding?.logos.header?.light).toBe('https://cdn.example/mark.png');
  });

  it('returns null for non-JSON input', () => {
    expect(igrpParseBranding('{not json')).toEqual({ branding: null, dropped: 0 });
  });

  it('returns null for any version other than 1', () => {
    expect(igrpParseBranding(doc({ version: 2, tokens: {}, logos: {} })).branding).toBeNull();
    expect(igrpParseBranding(doc({ tokens: {}, logos: {} })).branding).toBeNull();
  });

  it('returns null for a document over the byte limit', () => {
    const huge = 'x'.repeat(BRANDING_MAX_BYTES + 1);
    expect(igrpParseBranding(huge)).toEqual({ branding: null, dropped: 0 });
  });

  it('drops a token value that would break out of its rule, keeps the rest', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: {
          light: { '--primary': 'red;}body{background:blue', '--accent': 'oklch(0.5 0.1 200)' },
        },
        logos: {},
      }),
    );
    expect(result.branding?.tokens.light).toEqual({ '--accent': 'oklch(0.5 0.1 200)' });
    expect(result.dropped).toBe(1);
  });

  it('drops a url() value and a token name that is not well formed', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: { light: { '--primary': 'url(https://evil.example/x)', 'primary': 'red' } },
        logos: {},
      }),
    );
    expect(result.branding?.tokens.light).toEqual({});
    expect(result.dropped).toBe(2);
  });

  it('drops a logo URL that is not http(s) or carries credentials', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: {},
        logos: {
          header: { light: 'javascript:alert(1)' },
          favicon: { light: 'https://user:pw@cdn.example/f.png' },
        },
      }),
    );
    expect(result.branding?.logos.header).toBeUndefined();
    expect(result.branding?.logos.favicon).toBeUndefined();
    expect(result.dropped).toBe(2);
  });

  it('keeps width and height on the wide logo and ignores them elsewhere', () => {
    const result = igrpParseBranding(
      doc({
        version: 1,
        tokens: {},
        logos: {
          wide: { light: 'https://cdn.example/w.svg', width: 320, height: 96 },
          header: { light: 'https://cdn.example/h.png', width: 999 },
        },
      }),
    );
    expect(result.branding?.logos.wide).toEqual({ light: 'https://cdn.example/w.svg', width: 320, height: 96 });
    expect(result.branding?.logos.header).toEqual({ light: 'https://cdn.example/h.png' });
  });

  it('ignores unknown top-level and nested keys without counting them', () => {
    const result = igrpParseBranding(
      doc({ version: 1, tokens: { light: {}, future: true }, logos: {}, extra: 1 }),
    );
    expect(result.branding).not.toBeNull();
    expect(result.dropped).toBe(0);
  });
});
