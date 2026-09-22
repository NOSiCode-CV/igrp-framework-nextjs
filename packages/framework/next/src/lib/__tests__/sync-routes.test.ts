import { describe, it, expect, vi, beforeEach } from 'vitest';

const { parseRouteParamMap, routeResourceName } = await import('../sync-routes.js');

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('parseRouteParamMap', () => {
  it('reads flat entries', () => {
    const map = parseRouteParamMap('"/dashboard": {},\n"/users/[id]": { id: string }');
    expect(map.get('/dashboard')).toBe(true);
    expect(map.get('/users/[id]')).toBe(false);
  });

  // The old `(\{[\s\S]*?})` stopped at the first `}`, so a nested object
  // truncated the match and the route was misread as "has params" — silently
  // dropping a parameterless route from the sync.
  it('does not truncate on a nested object', () => {
    const map = parseRouteParamMap('"/a": { "nested": { } },\n"/b": {}');
    expect(map.get('/a')).toBe(false);
    expect(map.get('/b')).toBe(true);
    // ...and a nested key is never mistaken for a top-level route.
    expect(map.has('nested')).toBe(false);
  });

  // The destructive character is an OPENING brace inside a string: it inflated
  // depth, so the scan never rebalanced, gave up, and dropped this route AND
  // every route after it. A closing brace alone yields the same verdict for the
  // route it sits in, which is why that case on its own proves nothing.
  it('does not let an opening brace inside a string swallow later routes', () => {
    const map = parseRouteParamMap('"/a": { "x": "{" },\n"/b": {}');
    expect(map.get('/a')).toBe(false);
    expect(map.get('/b')).toBe(true);
  });

  it('does not let a closing brace inside a string end the object early', () => {
    const map = parseRouteParamMap('"/a": { "x": "}" },\n"/b": {}');
    expect(map.get('/a')).toBe(false);
    expect(map.get('/b')).toBe(true);
  });

  it('treats a route-shaped key inside a string as data, not a route', () => {
    const map = parseRouteParamMap('"/a": { "note": "see /x" },\n"/b": {}');
    expect(map.has('/x')).toBe(false);
    expect(map.get('/b')).toBe(true);
  });

  it('handles an escaped quote inside the object body', () => {
    const map = parseRouteParamMap('"/a": { "x": "\\"" },\n"/b": {}');
    expect(map.get('/b')).toBe(true);
  });

  it('handles a template literal in the object body', () => {
    const map = parseRouteParamMap('"/a": { "x": `{` },\n"/b": {}');
    expect(map.get('/a')).toBe(false);
    expect(map.get('/b')).toBe(true);
  });

  it('stops at unbalanced input instead of recording a half-read object', () => {
    expect(parseRouteParamMap('"/a": { "x": 1').size).toBe(0);
  });

  // Every route after the break is dropped; the only symptom would otherwise be
  // a resource list that is quietly short.
  it('warns when it gives up part-way through', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const map = parseRouteParamMap('"/ok": {},\n"/bad": { "x": 1');
    expect(map.get('/ok')).toBe(true);
    expect(map.has('/bad')).toBe(false);
    expect(warn.mock.calls.flat().join(' ')).toContain('/bad');
  });
});

describe('routeResourceName', () => {
  it('replaces every separator, not just the first', () => {
    // Previously `/admin/users` → `svc--admin/users`: `replace('/', '-')` hit
    // only the leading slash, leaving a double dash and an embedded slash.
    expect(routeResourceName('svc', '/admin/users')).toBe('svc-admin-users');
  });

  it('does not double the separator on a top-level route', () => {
    expect(routeResourceName('svc', '/dashboard')).toBe('svc-dashboard');
  });

  it('falls back to the service id for the root route', () => {
    expect(routeResourceName('svc', '/')).toBe('svc');
  });
});
