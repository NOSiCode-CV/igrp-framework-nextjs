import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IGRPColors, type IGRPColorVariants } from './colors';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const igrpColorText = (value: IGRPColorVariants) => {
  return IGRPColors['solid'][value].text;
};

export function igrpIsExternalUrl(url?: string | null) {
  return !!url && (/^https?:\/\//.test(url) || url.startsWith('www.'));
}

export function igrpNormalizeUrl(url?: string | null) {
  if (!url) return url;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}
