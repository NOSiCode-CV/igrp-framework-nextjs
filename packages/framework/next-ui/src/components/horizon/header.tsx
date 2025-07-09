import { Separator } from '../primitives/separator';
import { SidebarTrigger } from '../primitives/sidebar';
import { IGRPBreadcrumbs } from './breadcrumbs';
import { IGRPCommandSearch } from './command-search';
import { IGRPModeSwitcher } from './mode-switcher';
import type { IGRPHeaderDataArgs } from '../../types';
import { Notifications } from './notifications';
import { IGRPNavUserHeader } from './nav-user-header';

interface IGRPHeaderProps {
  data?: IGRPHeaderDataArgs;
  className?: string;
  languageSelector?: React.ReactNode;
  locale?: string;
}

export function IGRPHeader({
  languageSelector,
  locale = 'pt',
  data,
}: IGRPHeaderProps) {

  if (!data) return null; 

  const {
    user,
    showBreadcrumbs,
    showSearch,
    showLanguageSelector,
    showNotifications,
    showThemeSwitcher,
    showUser    
  } = data;  

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
        {showSearch && <IGRPCommandSearch />}

        {showNotifications && (
          <span className='hidden md:block'>
            <Notifications />
          </span>
        )}

        {showThemeSwitcher && <IGRPModeSwitcher />}

        {showLanguageSelector && languageSelector}

        {showUser && <IGRPNavUserHeader user={user} />}
      </div>
    </header>
  );
}
