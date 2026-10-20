import { describe, expect, it } from 'vitest';

import * as ui from '../index.js';

describe('preset themes are removed', () => {
  it.each([
    'IGRPActiveThemeProvider',
    'useIGRPThemeConfig',
    'igrpActiveThemeClassName',
    'IGRP_ACTIVE_THEME_COOKIE',
    'IGRP_DEFAULT_THEMES',
    'IGRP_SCALED_THEMES',
    'IGRPTemplateThemeSelector',
  ])('does not export %s', (name) => {
    expect(name in ui).toBe(false);
  });

  it('still exports the light / dark / system mode switcher', () => {
    expect('IGRPTemplateModeSwitcher' in ui).toBe(true);
  });
});
