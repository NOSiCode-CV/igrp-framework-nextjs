import { describe, expect, it } from 'vitest';

import {
  igrpCompare,
  igrpFormatDate,
  igrpFormatDateTime,
  igrpFormatNumber,
  igrpFormatRelativeTime,
} from '../format.js';

const date = new Date(Date.UTC(2026, 9, 12, 14, 5));

describe('format helpers', () => {
  it('renders an impossible date-only string as empty', () => {
    expect(igrpFormatDate('2026-02-31', 'pt-CV')).toBe('');
  });

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
  it('apply the time zone parameter, so the same instant renders in the platform zone', () => {
    const lateUtc = new Date(Date.UTC(2026, 9, 12, 23, 30));
    expect(igrpFormatDate(lateUtc, 'pt-CV', undefined, 'Asia/Tokyo')).toBe('13/10/2026');
    expect(igrpFormatDate(lateUtc, 'pt-CV', undefined, 'Atlantic/Cape_Verde')).toBe('12/10/2026');
    expect(igrpFormatDateTime(date, 'en-GB', undefined, 'Atlantic/Cape_Verde')).toMatch(
      /12\/10\/2026,? 13:05/,
    );
  });
  it('let options.timeZone win over the time zone parameter', () => {
    expect(igrpFormatDateTime(date, 'en-GB', { timeZone: 'UTC' }, 'Asia/Tokyo')).toMatch(
      /12\/10\/2026,? 14:05/,
    );
  });
  it('append HH:mm for date-times', () => {
    expect(igrpFormatDateTime(date, 'en-GB', { timeZone: 'UTC' })).toMatch(/12\/10\/2026,? 14:05/);
  });
  it('format numbers per region', () => {
    expect(igrpFormatNumber(1234.5, 'en-GB')).toBe('1,234.5');
    expect(igrpFormatNumber(1234.5, 'fr-FR')).toBe((1234.5).toLocaleString('fr-FR'));
  });
  it('format relative time in the largest fitting unit, past and future', () => {
    const now = new Date(Date.UTC(2026, 9, 12, 12, 0, 0));
    const at = (ms: number) => new Date(now.getTime() + ms);
    const MIN = 60_000;
    expect(igrpFormatRelativeTime(at(-30_000), now, 'en-GB')).toBe('30 seconds ago');
    expect(igrpFormatRelativeTime(at(-5 * MIN), now, 'en-GB')).toBe('5 minutes ago');
    expect(igrpFormatRelativeTime(at(3 * 60 * MIN), now, 'en-GB')).toBe('in 3 hours');
    expect(igrpFormatRelativeTime(at(-2 * 24 * 60 * MIN), now, 'en-GB')).toBe('2 days ago');
    expect(igrpFormatRelativeTime(at(3 * 7 * 24 * 60 * MIN), now, 'en-GB')).toBe('in 3 weeks');
    expect(igrpFormatRelativeTime(at(-45 * 24 * 60 * MIN), now, 'en-GB')).toBe('last month');
    expect(igrpFormatRelativeTime(at(2 * 365 * 24 * 60 * MIN), now, 'en-GB')).toBe('in 2 years');
    expect(igrpFormatRelativeTime(at(-5 * MIN), now, 'pt-CV')).toBe('há 5 minutos');
  });
  it('relative time: "now" for the same instant, "" for invalid input, string and number input', () => {
    const now = new Date(Date.UTC(2026, 9, 12, 12, 0, 0));
    expect(igrpFormatRelativeTime(now, now, 'en-GB')).toBe('now');
    expect(igrpFormatRelativeTime('garbage', now, 'en-GB')).toBe('');
    expect(igrpFormatRelativeTime(null, now, 'en-GB')).toBe('');
    expect(igrpFormatRelativeTime(now.getTime() - 60_000, now.toISOString(), 'en-GB')).toBe(
      '1 minute ago',
    );
  });
  it('compare case- and accent-insensitively, numeric-aware', () => {
    expect(igrpCompare('ação', 'Acao', 'pt-CV')).toBe(0);
    expect(igrpCompare('item2', 'item10', 'en-GB')).toBeLessThan(0);
    expect(igrpCompare(undefined, 'a', 'en-GB')).toBeLessThan(0);
  });
  it('formats a date-only string as that calendar day in any zone', () => {
    expect(igrpFormatDate('2026-10-20', 'pt-CV', undefined, 'Atlantic/Cape_Verde')).toBe(
      '20/10/2026',
    );
    expect(igrpFormatDate('2026-10-20', 'pt-CV', undefined, 'America/New_York')).toBe('20/10/2026');
    expect(igrpFormatDate('2026-10-20', 'pt-CV', undefined, 'Asia/Tokyo')).toBe('20/10/2026');
  });
  it('accepts dateStyle/timeStyle in igrpFormatDateTime', () => {
    expect(() =>
      igrpFormatDateTime(new Date(), 'en-GB', { dateStyle: 'short', timeStyle: 'short' }),
    ).not.toThrow();
  });
  it('promotes a rounded value that fills the next unit', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    expect(igrpFormatRelativeTime(new Date(now.getTime() + 59_600), now, 'en-GB')).toBe(
      'in 1 minute',
    );
    expect(igrpFormatRelativeTime(new Date(now.getTime() + 30_000), now, 'en-GB')).toBe(
      'in 30 seconds',
    );
  });
});
