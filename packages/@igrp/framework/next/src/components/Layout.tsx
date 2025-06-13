import { Header } from '@/components/_header';
import { Sidebar } from './_sidebar';
import { useHeaderData } from '../hooks/use-header-data';
import { useSidebarData } from '../hooks/use-sidebar-data';
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
}

export function Layout({
  children,
  className,
  showHeader = true,
  showSidebar = true,
}: LayoutProps) {
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { data: headerData, loading: headerLoading } = useHeaderData();
  const { data: sidebarData, loading: sidebarLoading } = useSidebarData();

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {showHeader && (
        <Header
          data={headerData}
          loading={headerLoading}
        />
      )}
      
      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar
            data={sidebarData}
            loading={sidebarLoading}
            onToggle={undefined}
          />
        )}
        
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 