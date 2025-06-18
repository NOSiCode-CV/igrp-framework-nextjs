'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarInset, SidebarProvider } from './primitives/sidebar';
import { Toaster } from './primitives/sonner';
import { Header } from '@/components/header';
import { AppSidebar } from './app-sidebar';
import type { HeaderData, SidebarData } from '@/types';

export interface LayoutProps {
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

export function Layout({
  children,
  showSidebar,
  defaultOpen,
  showHeader,
  locale = 'pt',
  showLanguageSelector = true,
  languageSelector,
  headerData,
  sidebarData

}: LayoutProps) {
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient()); 

  const showBreadcrumbs = pathname !== `/${locale}`;

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider defaultOpen={defaultOpen}>
          {showSidebar && <AppSidebar data={sidebarData} />}

          <SidebarInset>
            {showHeader && (
              <Header
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
      </QueryClientProvider>
      <Toaster richColors />
    </>
  );
}
