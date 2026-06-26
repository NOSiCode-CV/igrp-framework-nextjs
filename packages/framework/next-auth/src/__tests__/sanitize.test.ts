import { describe, it, expect } from 'vitest';
import { sanitizeRedirectUrl } from '../sanitize';

describe('sanitizeRedirectUrl — open-redirect hardening', () => {
  const ORIGIN = 'http://localhost:3000';

  it('rejects a leading backslash (protocol-relative bypass)', () => {
    expect(sanitizeRedirectUrl('/\\evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a percent-encoded backslash bypass', () => {
    expect(sanitizeRedirectUrl('/%5Cevil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a mixed slash-backslash bypass', () => {
    expect(sanitizeRedirectUrl('/\\/evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a path-traversal segment', () => {
    expect(sanitizeRedirectUrl('/a/../../etc', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects an encoded path-traversal segment', () => {
    expect(sanitizeRedirectUrl('/a/%2e%2e/etc', ORIGIN, '/safe')).toBe('/safe');
  });

  it('still rejects protocol-relative //', () => {
    expect(sanitizeRedirectUrl('//evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('allows a normal relative path', () => {
    expect(sanitizeRedirectUrl('/dashboard', ORIGIN, '/safe')).toBe('/dashboard');
  });

  it('preserves a query string on a relative path', () => {
    expect(sanitizeRedirectUrl('/list?tab=open', ORIGIN, '/safe')).toBe('/list?tab=open');
  });

  it('allows a non-traversal value with .. inside a query', () => {
    expect(sanitizeRedirectUrl('/range?d=1..10', ORIGIN, '/safe')).toBe('/range?d=1..10');
  });

  it('allows a same-origin absolute URL (returns path+search)', () => {
    expect(sanitizeRedirectUrl('http://localhost:3000/x?a=1', ORIGIN, '/safe')).toBe('/x?a=1');
  });
});
