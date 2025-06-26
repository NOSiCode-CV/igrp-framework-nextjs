import { Separator } from '@/components/primitives/separator';
import { SidebarTrigger } from '@/components/primitives/sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { IGRPCommandSearch } from './command-search';
import { IGRPModeSwitcher } from './mode-switcher';
import type { HeaderData } from '@/types/globals';
import { Notifications } from './notifications';

interface HeaderProps {
  showBreadcrumbs?: boolean;
  data?: HeaderData;
  className?: string;
  showLanguageSelector?: boolean;
  languageSelector?: React.ReactNode;
  locale?: string;
}

export function IGRPHeader({
  showBreadcrumbs,
  showLanguageSelector,
  languageSelector,
  locale = 'pt',
}: HeaderProps) {
  return (
    <header className='bg-background sticky top-0 inset-x-0 isolate z-10 border-b flex items-center justify-between gap-2 px-4'>
      <div className='flex items-center gap-2 h-12'>
        <SidebarTrigger />
        {showBreadcrumbs && (
          <>
            <Separator
              orientation='vertical'
              className='mr-2 data-[orientation=vertical]:h-4'
            />
            <Breadcrumbs locale={locale} />
          </>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <IGRPCommandSearch />
        <span className='hidden md:block'>
          <Notifications />
        </span>
        <IGRPModeSwitcher />
        {showLanguageSelector && languageSelector}
      </div>
    </header>
  );
}
