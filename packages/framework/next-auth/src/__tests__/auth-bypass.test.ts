import { describe, expect, it } from 'vitest';

import { isIgrpAuthBypass, isPreviewModeEnabled } from '../providers';

describe('isIgrpAuthBypass', () => {
  it.each([
    [{ IGRP_PREVIEW_MODE: 'true' }, true],
    [{ IGRP_PREVIEW_MODE: ' "TRUE" ' }, true],
    [{ AUTH_PROVIDER: 'none' }, true],
    [{ AUTH_PROVIDER: "'NONE'" }, true],
    [{ IGRP_PREVIEW_MODE: 'false', AUTH_PROVIDER: 'igrp-auth' }, false],
    [{}, false],
    // A typo or an empty value must never switch auth off.
    [{ AUTH_PROVIDER: 'nonee' }, false],
    [{ AUTH_PROVIDER: '' }, false],
  ])('%j → %s', (env, expected) => {
    expect(isIgrpAuthBypass(env)).toBe(expected);
  });

  it('reads preview mode the same way', () => {
    expect(isPreviewModeEnabled({ IGRP_PREVIEW_MODE: "'true'" })).toBe(true);
    expect(isPreviewModeEnabled({ IGRP_PREVIEW_MODE: '1' })).toBe(false);
  });
});
