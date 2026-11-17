import { describe, expect, it } from 'vitest';

import { igrpBuildQueryString } from '../build-query-string.js';

describe('igrpBuildQueryString', () => {
  it.each<[string, Record<string, string | number | undefined>, string]>([
    ['no params', {}, ''],
    ['only undefined values', { a: undefined, b: undefined }, ''],
    ['one string', { q: 'x' }, '?q=x'],
    ['a number', { page: 2 }, '?page=2'],
    ['zero (falsy, still kept)', { page: 0 }, '?page=0'],
    ['empty string (kept)', { q: '' }, '?q='],
    ['undefined dropped among others', { a: '1', b: undefined, c: 3 }, '?a=1&c=3'],
    ['value with reserved characters', { q: 'a&b=c d' }, '?q=a%26b%3Dc%20d'],
    ['key with reserved characters', { 'a&b=c': 'v' }, '?a%26b%3Dc=v'],
    ['non-ASCII value', { name: 'João' }, '?name=Jo%C3%A3o'],
  ])('%s', (_, params, expected) => {
    expect(igrpBuildQueryString(params)).toBe(expected);
  });

  it('keeps insertion order', () => {
    expect(igrpBuildQueryString({ z: 1, a: 2, m: 3 })).toBe('?z=1&a=2&m=3');
  });
});
