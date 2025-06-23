import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'
import localization from './localization'

export const routing = defineRouting({
  locales: localization.locales.map((locale) => locale.code),
  defaultLocale: localization.defaultLocale,
})

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const { Link, getPathname, redirect, usePathname, useRouter } = createNavigation(routing);

export type Locale = (typeof routing.locales)[number]
