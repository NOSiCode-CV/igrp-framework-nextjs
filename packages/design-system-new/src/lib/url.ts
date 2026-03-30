/** Returns true if the URL points to a different origin than the current page. */
export function igrpIsExternalUrl(url?: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/** Ensures URL has leading slash or full protocol. Relative paths get / prefix. */
export function igrpNormalizeUrl(url: string): string {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  if (url.startsWith('/')) return url;

  return `/${url}`;
}
