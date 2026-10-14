import 'server-only';

export { igrpResolveLocale, igrpResolveFormatLocale } from './resolve.js';
export { igrpCreateRequestConfig } from './request-config.js';
export { igrpGetDesignSystemStrings, igrpGetChromeStrings } from './strings.js';
export { igrpSetLocale, type IGRPSetLocaleResult } from './set-locale.js';
export { igrpOnIntlError, igrpGetMessageFallback } from '../fallback.js';
