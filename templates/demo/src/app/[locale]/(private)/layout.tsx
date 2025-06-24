import { IGRPProtectedLayout } from '@igrp/framework-next/server';
import { igrpMockDataProvider } from '@/lib/mock-provider';
import { LanguageSelector } from '@/components/language-selector';
import type { IGRPConfigClient } from '@igrp/framework-next';

const serverFunction: IGRPConfigClient = async () => {
  'use server';

  const headerData = await igrpMockDataProvider.getHeaderData();
  const sidebarData = await igrpMockDataProvider.getSidebarData();

  return {
    appCode: 'demo',
    previewMode: true,
    headerData,
    sidebarData,
  };
};


export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <IGRPProtectedLayout
      languageSelector={<LanguageSelector />}
      serverFunction={serverFunction}
    >
      {children}
    </IGRPProtectedLayout>
  );
}
