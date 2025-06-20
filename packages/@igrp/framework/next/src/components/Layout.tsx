"use client"

import { usePathname } from 'next/navigation';
import { SidebarInset, SidebarProvider } from './primitives/sidebar';
import { Toaster } from './primitives/sonner';
import { IGRPHeader } from '@/components/header';
import { IGRPAppSidebar } from './app-sidebar';
import type { HeaderData, SidebarData } from '@/types';

export interface IGRPLayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  defaultOpen?: boolean;
  showHeader?: boolean;
  locale?: string;
  showLanguageSelector?: boolean;
  languageSelector?: React.ReactNode;
  headerData?: HeaderData;
  sidebarData?: SidebarData;
}

export function IGRPLayout({
  children,
  showSidebar = true,
  defaultOpen,
  showHeader = true,
  locale = 'pt',
  showLanguageSelector = true,
  languageSelector,
  headerData,
  sidebarData

}: IGRPLayoutProps) {
  const pathname = usePathname();

  const showBreadcrumbs = pathname !== `/${locale}`;

  return (
    <>
      <SidebarProvider defaultOpen={defaultOpen}>
        {showSidebar && <IGRPAppSidebar data={sidebarData} />}

        <SidebarInset>
          {showHeader && (
            <IGRPHeader
              data={headerData}
              showBreadcrumbs={showBreadcrumbs}
              showLanguageSelector={showLanguageSelector}
              languageSelector={languageSelector}
              locale={locale}
            />
          )}
          <main className='flex flex-col flex-1 px-6 py-8'>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster richColors />
    </>
  );
}
