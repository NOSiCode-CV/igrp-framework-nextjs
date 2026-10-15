import { describe, expect, it } from 'vitest';

import { igrpBrandingToCss, igrpParseBranding } from '../index.js';

describe('igrpBrandingToCss', () => {
  it('returns an empty string for no Brand', () => {
    expect(igrpBrandingToCss(null)).toBe('');
  });

  it('emits html:root:not(.dark) for light and html:root.dark for dark', () => {
    const { branding } = igrpParseBranding(
      JSON.stringify({
        version: 1,
        tokens: {
          light: { '--primary': 'oklch(0.45 0.18 250)' },
          dark: { '--primary': 'oklch(0.78 0.14 250)' },
        },
        logos: {},
      }),
    );
    expect(igrpBrandingToCss(branding)).toBe(
      'html:root:not(.dark){--primary:oklch(0.45 0.18 250);}html:root.dark{--primary:oklch(0.78 0.14 250);}',
    );
  });

  it('is deterministic: the same Brand in another key order yields the same bytes', () => {
    const a = igrpParseBranding(
      JSON.stringify({ version: 1, tokens: { light: { '--b': 'red', '--a': 'blue' } }, logos: {} }),
    ).branding;
    const b = igrpParseBranding(
      JSON.stringify({ version: 1, tokens: { light: { '--a': 'blue', '--b': 'red' } }, logos: {} }),
    ).branding;
    expect(igrpBrandingToCss(a)).toBe(igrpBrandingToCss(b));
    expect(igrpBrandingToCss(a)).toBe('html:root:not(.dark){--a:blue;--b:red;}');
  });

  it('emits nothing for empty token maps', () => {
    const { branding } = igrpParseBranding(JSON.stringify({ version: 1, tokens: {}, logos: {} }));
    expect(igrpBrandingToCss(branding)).toBe('');
  });

  it('keeps a light-only token out of dark mode (a missing dark key keeps the Default)', () => {
    const { branding } = igrpParseBranding(
      JSON.stringify({ version: 1, tokens: { light: { '--primary': 'red' } }, logos: {} }),
    );
    const css = igrpBrandingToCss(branding);
    expect(css).toBe('html:root:not(.dark){--primary:red;}');
    expect(css).not.toMatch(/(^|})html:root\{/);
  });
});
