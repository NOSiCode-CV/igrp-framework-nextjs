import { IGRPQueryProvider } from '@/providers/providers';

export default function IGRPGeneratedLayout({ 
  children 
}: Readonly<{ children: React.ReactNode }>) {
  return <IGRPQueryProvider>{children}</IGRPQueryProvider>;
}
