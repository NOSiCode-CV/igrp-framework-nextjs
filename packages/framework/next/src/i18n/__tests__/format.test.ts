import { describe, expect, it } from 'vitest';

import { igrpCompare, igrpFormatDate, igrpFormatDateTime, igrpFormatNumber } from '../format.js';

const date = new Date(Date.UTC(2026, 9, 12, 14, 5));

describe('format helpers', () => {
  it('format dates as dd/mm/yyyy in the three default regions', () => {
    expect(igrpFormatDate(date, 'pt-CV')).toBe('12/10/2026');
    expect(igrpFormatDate(date, 'en-GB')).toBe('12/10/2026');
    expect(igrpFormatDate(date, 'fr-FR')).toBe('12/10/2026');
  });
  it('return "" for missing or invalid input', () => {
    expect(igrpFormatDate(null, 'pt-CV')).toBe('');
    expect(igrpFormatDate('not a date', 'pt-CV')).toBe('');
    expect(igrpFormatDateTime(undefined, 'pt-CV')).toBe('');
  });
  it('append HH:mm for date-times', () => {
    expect(igrpFormatDateTime(date, 'en-GB', { timeZone: 'UTC' })).toMatch(/12\/10\/2026,? 14:05/);
  });
  it('format numbers per region', () => {
    expect(igrpFormatNumber(1234.5, 'en-GB')).toBe('1,234.5');
    expect(igrpFormatNumber(1234.5, 'fr-FR')).toBe((1234.5).toLocaleString('fr-FR'));
  });
  it('compare case- and accent-insensitively, numeric-aware', () => {
    expect(igrpCompare('ação', 'Acao', 'pt-CV')).toBe(0);
    expect(igrpCompare('item2', 'item10', 'en-GB')).toBeLessThan(0);
    expect(igrpCompare(undefined, 'a', 'en-GB')).toBeLessThan(0);
  });
});
