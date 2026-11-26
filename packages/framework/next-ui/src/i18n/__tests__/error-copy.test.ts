import { describe, expect, it } from 'vitest';

import { igrpResolveErrorCopy } from '../error-copy.js';
import { IGRP_CHROME_STRINGS_PT } from '../strings.js';

const catalog = {
  byCode: IGRP_CHROME_STRINGS_PT.errorCodes,
  fallback: IGRP_CHROME_STRINGS_PT.globalError,
};
const withCode = (code: unknown) => Object.assign(new Error('x'), { code });

describe('igrpResolveErrorCopy', () => {
  it('uses the catalog entry for a known platform code', () => {
    expect(igrpResolveErrorCopy(withCode('IGRP_APP_CODE_MISSING'), catalog)).toEqual(
      IGRP_CHROME_STRINGS_PT.errorCodes.IGRP_APP_CODE_MISSING,
    );
  });

  it('falls back to the generic pair for an unknown or missing code', () => {
    const generic = { title: catalog.fallback.title, description: catalog.fallback.description };
    expect(igrpResolveErrorCopy(withCode('SOMETHING_ELSE'), catalog)).toEqual(generic);
    expect(igrpResolveErrorCopy(new Error('x'), catalog)).toEqual(generic);
    expect(igrpResolveErrorCopy(withCode(42), catalog)).toEqual(generic);
  });

  it('reads the code from a server error digest (<id>|<code>)', () => {
    const fromServer = (digest: string) => Object.assign(new Error('omitted'), { digest });
    const generic = { title: catalog.fallback.title, description: catalog.fallback.description };

    expect(igrpResolveErrorCopy(fromServer('m1-ab|IGRP_APP_HOME_SLUG_INVALID'), catalog)).toEqual(
      IGRP_CHROME_STRINGS_PT.errorCodes.IGRP_APP_HOME_SLUG_INVALID,
    );
    // An AppError message, a Next hash and an unknown code fall through.
    expect(igrpResolveErrorCopy(fromServer('m1-ab|Perfil indisponível.'), catalog)).toEqual(
      generic,
    );
    expect(igrpResolveErrorCopy(fromServer('2384712'), catalog)).toEqual(generic);
    expect(igrpResolveErrorCopy(fromServer('m1-ab|IGRP_NOPE'), catalog)).toEqual(generic);
  });

  it('prefers the error own code over the digest', () => {
    const error = Object.assign(withCode('IGRP_APP_CODE_MISSING'), {
      digest: 'm1-ab|IGRP_CONFIG_INVALID',
    });
    expect(igrpResolveErrorCopy(error, catalog)).toEqual(
      IGRP_CHROME_STRINGS_PT.errorCodes.IGRP_APP_CODE_MISSING,
    );
  });

  it('lets a custom resolver override fully or partially', () => {
    const full = igrpResolveErrorCopy(new Error('x'), catalog, () => ({
      title: 'T',
      description: 'D',
    }));
    expect(full).toEqual({ title: 'T', description: 'D' });

    const partial = igrpResolveErrorCopy(withCode('IGRP_APP_CODE_MISSING'), catalog, () => ({
      description: 'From digest',
    }));
    expect(partial).toEqual({
      title: IGRP_CHROME_STRINGS_PT.errorCodes.IGRP_APP_CODE_MISSING.title,
      description: 'From digest',
    });
  });

  it('ignores a custom resolver that returns nothing', () => {
    expect(
      igrpResolveErrorCopy(withCode('IGRP_APP_CODE_MISSING'), catalog, () => undefined),
    ).toEqual(IGRP_CHROME_STRINGS_PT.errorCodes.IGRP_APP_CODE_MISSING);
  });
});
