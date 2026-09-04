'use client';

import Image, { type ImageProps } from 'next/image';
import { useState, type ReactNode } from 'react';

/**
 * `next/image` throws at render time when `src` points at a hostname that is not
 * listed under `images.remotePatterns` in the consuming app's `next.config`, and
 * that throw escapes to the nearest error boundary — taking the whole sidebar or
 * header down with it. App pictures and header logos are supplied by the
 * access-management backend at runtime, so a consumer cannot whitelist every host
 * up front.
 *
 * Remote sources are therefore rendered `unoptimized`, which bypasses the hostname
 * check (the check lives in the default image loader, and `unoptimized` skips it).
 * Anything that still fails to load — 404, DNS, CORS — falls back to `fallback`
 * instead of leaving a broken image in the chrome.
 */
interface IGRPTemplateImageProps extends Omit<ImageProps, 'src' | 'unoptimized' | 'onError'> {
  src?: string | null;
  fallback: ReactNode;
}

const isRemoteSrc = (src: string) => /^(https?:)?\/\//i.test(src);

function IGRPTemplateImage({ src, fallback, ...props }: IGRPTemplateImageProps) {
  // Tracks the src that failed rather than a boolean, so a new src retries on its own.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return <>{fallback}</>;

  return (
    <Image {...props} src={src} unoptimized={isRemoteSrc(src)} onError={() => setFailedSrc(src)} />
  );
}

export { IGRPTemplateImage, type IGRPTemplateImageProps };
