import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { IGRPBrandingStyle, igrpParseBranding } from '../index.js';

const brand = igrpParseBranding(
  JSON.stringify({ version: 1, tokens: { light: { '--primary': 'oklch(0.45 0.18 250)' } }, logos: {} }),
).branding;

describe('IGRPBrandingStyle', () => {
  it('renders a hoisted style with the Brand CSS', () => {
    const markup = renderToStaticMarkup(<IGRPBrandingStyle branding={brand} />);
    expect(markup).toContain('html:root{--primary:oklch(0.45 0.18 250);}');
    expect(markup).toContain('href="igrp-branding"');
  });

  it('renders nothing when there is no Brand', () => {
    expect(renderToStaticMarkup(<IGRPBrandingStyle branding={null} />)).toBe('');
  });

  it('renders the same bytes on every call (hydration safety)', () => {
    const first = renderToStaticMarkup(<IGRPBrandingStyle branding={brand} />);
    const second = renderToStaticMarkup(<IGRPBrandingStyle branding={brand} />);
    expect(second).toBe(first);
  });
});
