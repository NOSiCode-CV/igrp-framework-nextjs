import { SidebarInset, SidebarProvider } from '@/components/primitives/sidebar';
import { Toaster } from '@/components/primitives/sonner';
import { IGRPAppSidebar } from '@/components/horizon/app-sidebar';
import { IGRPHeader } from '@/components/horizon/header';
import type { HeaderData, SidebarData } from '@/types';

export interface IGRPProtectedLayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  defaultOpen?: boolean;
  showHeader?: boolean;
  locale?: string;
  showLanguageSelector?: boolean;
  headerData?: HeaderData;
  sidebarData?: SidebarData;
  languageSelector?: React.ReactNode;
}

export function IGRPProtectedLayout({
  children,
  showSidebar = true,
  defaultOpen,
  showHeader = true,
  locale = 'pt',
  showLanguageSelector = true,
  languageSelector,
  headerData,
  sidebarData,
}: IGRPProtectedLayoutProps) {
  return (
    <>
      <SidebarProvider defaultOpen={defaultOpen}>
        {showSidebar && <IGRPAppSidebar data={sidebarData} />}

        <SidebarInset>
          {showHeader && (
            <IGRPHeader
              data={headerData}
              showLanguageSelector={showLanguageSelector}
              languageSelector={languageSelector}
              locale={locale}
            />
          )}
          <main className='flex flex-col flex-1 px-6 py-8'>{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster richColors />
    </>
  );
}
