import { describe, expect, it } from 'vitest';
import { IGRP_LOCALE_COOKIE as UI_COOKIE } from '@igrp/framework-next-ui';

import { IGRP_LOCALE_COOKIE } from '../config.js';

describe('IGRP_LOCALE cookie name', () => {
  it('is the same constant in framework-next and framework-next-ui', () => {
    expect(IGRP_LOCALE_COOKIE).toBe(UI_COOKIE);
  });
});
