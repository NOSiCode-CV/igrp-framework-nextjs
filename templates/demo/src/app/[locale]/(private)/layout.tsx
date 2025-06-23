import { LanguageSelector } from "@/components/language-selector";
import { IGRPProtectedLayout } from "@igrp/framework-next";

export default async function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <IGRPProtectedLayout languageSelector={<LanguageSelector />}>
      {children}
    </IGRPProtectedLayout>
  );
}