import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function parseLocalDate(dateStr: string): Date {
  const [yStr, mStr, dStr] = dateStr.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if ([y, m, d].some((part) => Number.isNaN(part) || part === undefined || part === null)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return new Date(y, m - 1, d);
}
