import { IGRPQueryProvider } from '@/providers/query-client';

export default function IGRPGeneratedLayout({ 
  children 
}: Readonly<{ children: React.ReactNode }>) {
  return <IGRPQueryProvider>{children}</IGRPQueryProvider>;
}
