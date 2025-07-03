import { Separator } from '../primitives/separator';
import { SidebarTrigger } from '../primitives/sidebar';
import { IGRPBreadcrumbs } from './breadcrumbs';
import { IGRPCommandSearch } from './command-search';
import { IGRPModeSwitcher } from './mode-switcher';
import type { IGRPHeaderDataArgs } from '../../types/globals';
import { Notifications } from './notifications';
import { IGRPNavUserHeader } from './nav-user-header';

interface HeaderProps {
  showBreadcrumbs?: boolean;
  data?: IGRPHeaderDataArgs;
  className?: string;
  showLanguageSelector?: boolean;
  languageSelector?: React.ReactNode;
  locale?: string;
}

export function IGRPHeader({
  showBreadcrumbs = true,
  showLanguageSelector,
  languageSelector,
  locale = 'pt',
  data,
}: HeaderProps) {

  const user = data?.user;
  
  return (
    <header className='bg-background sticky top-0 inset-x-0 isolate z-10 border-b flex items-center justify-between gap-2 px-4 py-2'>
      <div className='flex items-center gap-2 h-12'>
        <SidebarTrigger />
        {showBreadcrumbs && (
          <>
            <Separator
              orientation='vertical'
              className='mr-2 data-[orientation=vertical]:h-4'
            />
            <IGRPBreadcrumbs locale={locale} />
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
        <IGRPNavUserHeader user={user} />
      </div>
    </header>
  );
}
