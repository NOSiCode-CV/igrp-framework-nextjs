import { type HeaderData } from '@/types';
import { cn } from '@/lib/utils';

interface HeaderProps {
  data?: HeaderData;
  loading?: boolean;
  className?: string;
}

export function Header({ data, loading = false, className }: HeaderProps) {
  if (loading) {
    return (
      <header className={cn(
        "bg-white border-b border-gray-200 px-6 py-4",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <header className={cn(
      "bg-white border-b border-gray-200 px-6 py-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">IGRP Admin</h1>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {data.quickActions.map((action) => (
              <a
                key={action.id}
                href={action.href}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <span className="mr-1">+</span>
                {action.title}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <span className="text-lg">🔔</span>
              {data.notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {data.notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </div>

          {/* User Menu */}
          <div className="relative group">
            <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors">
              {data.user.avatar ? (
                <img
                  src={data.user.avatar}
                  alt={data.user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600">👤</span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">{data.user.name}</span>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium">{data.user.name}</div>
                  <div className="text-gray-500">{data.user.email}</div>
                  <div className="text-xs text-gray-400">{data.user.role}</div>
                </div>
                <a
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-2">👤</span>
                  Perfil
                </a>
                <a
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-2">⚙️</span>
                  Configurações
                </a>
                <a
                  href="/logout"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-2">🚪</span>
                  Sair
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 