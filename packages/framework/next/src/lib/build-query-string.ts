export function igrpBuildQueryString(params: Record<string, string | number | undefined>): string {
  const validParams = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    // Both sides are encoded: a key carrying `&`, `=` or a space silently
    // forged extra parameters when only the value was escaped.
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return validParams.length > 0 ? `?${validParams.join('&')}` : '';
}
