// `@igrp/framework-next/i18n` — Edge-safe entry. Keep it free of React,
// next/headers and the root barrel; app middleware imports it.
export {
  IGRP_LOCALES,
  IGRP_LOCALE_NATIVE_NAMES,
  IGRP_LOCALE_COOKIE,
  IGRP_DEFAULT_FORMAT_LOCALES,
  igrpLocaleCookieOptions,
  igrpIsLocale,
  igrpNormalizeLocale,
  igrpParseAcceptLanguage,
  igrpParseFormatLocales,
  igrpDefineI18n,
  igrpPickLocale,
  type IGRPLocale,
  type IGRPI18nConfig,
  type IGRPI18nOptions,
  type IGRPI18nOverrides,
  type IGRPChromeStringsOverride,
  type IGRPLocaleCandidates,
} from './config.js';
export { igrpSyncLocaleCookie } from './sync-cookie.js';
export {
  igrpFormatDate,
  igrpFormatDateTime,
  igrpFormatNumber,
  igrpFormatRelativeTime,
  igrpCompare,
  type IGRPDateInput,
} from './format.js';
