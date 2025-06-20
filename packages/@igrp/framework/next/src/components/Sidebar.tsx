import { ChevronLeft, ChevronRight, Home, FileText, Users, type LucideIcon } from 'lucide-react';
import type { SidebarData, MenuItem } from '../types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  data?: SidebarData;
  loading?: boolean;
  className?: string;
  onToggle?: (collapsed: boolean) => void;
}

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  'file-text': FileText,
  users: Users,
};

function MenuItemComponent({ item, collapsed }: { item: MenuItem; collapsed: boolean }) {
  const IconComponent = item.icon ? iconMap[item.icon] : null;

  return (
    <div key={item.id}>
      <a
        href={item.href || '#'}
        className={cn(
          "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
          item.isActive
            ? "bg-blue-100 text-blue-700"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        {IconComponent && <IconComponent className="w-4 h-4 mr-3" />}
        {!collapsed && <span>{item.title}</span>}
      </a>
      
      {item.children && !collapsed && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children.map((child) => (
            <a
              key={child.id}
              href={child.href || '#'}
              className={cn(
                "block px-4 py-2 text-sm rounded-md transition-colors",
                child.isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              {child.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ data, loading = false, className, onToggle }: SidebarProps) {
  if (loading) {
    return (
      <aside className={cn(
        "bg-white border-r border-gray-200 w-64 flex-shrink-0",
        className
      )}>
        <div className="p-4">
          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mb-6"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300",
      data.collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="p-4">
        {/* Toggle Button */}
        <div className="flex items-center justify-between mb-6">
          {!data.collapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          )}
          <button
            onClick={() => onToggle?.(!data.collapsed)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {data.collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {data.menuItems.map((item) => (
            <MenuItemComponent
              key={item.id}
              item={item}
              collapsed={data.collapsed}
            />
          ))}
        </nav>

        {/* User Info */}
        {!data.collapsed && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {data.user.avatar ? (
                <img
                  src={data.user.avatar}
                  alt={data.user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">{data.user.name}</div>
                <div className="text-xs text-gray-500">{data.user.role}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
} 