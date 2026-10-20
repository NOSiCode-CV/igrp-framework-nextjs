import { describe, expect, it } from 'vitest';

import { igrpLastFormatLocale, igrpRecordFormatLocale } from '../client/locale-info.js';

describe('igrpLastFormatLocale', () => {
  it('is undefined until the provider records one, then returns the latest', () => {
    expect(igrpLastFormatLocale()).toBeUndefined();
    igrpRecordFormatLocale('pt-PT');
    igrpRecordFormatLocale('en-US');
    expect(igrpLastFormatLocale()).toBe('en-US');
  });
});
