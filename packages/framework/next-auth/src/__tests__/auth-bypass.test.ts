import { afterEach, describe, expect, it } from 'vitest';

import { withIGRPAuth } from '../config';
import { isIgrpAuthBypass, isPreviewModeEnabled, registerIGRPAuthBypass } from '../providers';

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

describe('isIgrpAuthBypass with a registered instance', () => {
  afterEach(() => registerIGRPAuthBypass(null));

  // `provider:` can disagree with AUTH_PROVIDER; the middleware asks the
  // instance, so server actions and permissions must get the same answer.
  it('answers like the withIGRPAuth instance, not the process env', () => {
    expect(isIgrpAuthBypass()).toBe(false);
    withIGRPAuth({ env: { AUTH_PROVIDER: 'none' } });
    expect(isIgrpAuthBypass()).toBe(true);
    expect(isIgrpAuthBypass(process.env)).toBe(true);
  });

  it('still answers from an explicitly passed env', () => {
    registerIGRPAuthBypass(() => true);
    expect(isIgrpAuthBypass({ AUTH_PROVIDER: 'igrp-auth' })).toBe(false);
  });
});
