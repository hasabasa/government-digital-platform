import React from 'react';
import { clsx } from 'clsx';
import { Menu, Settings, Edit, X, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';
import { apiService } from '../../services/api.service';
import toast from 'react-hot-toast';

interface SidebarHeaderProps {
  onClose?: () => void;
  className?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  onClose, 
  className 
}) => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [showThemeMenu, setShowThemeMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const themeOptions = [
    { key: 'light', label: 'Светлая', icon: Sun },
    { key: 'dark', label: 'Тёмная', icon: Moon },
    { key: 'system', label: 'Системная', icon: Monitor },
  ];

  const getCurrentThemeIcon = () => {
    const option = themeOptions.find(opt => opt.key === theme);
    return option ? option.icon : Monitor;
  };

  const ThemeIcon = getCurrentThemeIcon();

  const handleLogout = async () => {
    try {
      await apiService.logout();
      logout();
      toast.success('Вы успешно вышли из системы');
      // Перенаправляем на страницу входа
      window.location.href = '/login';
    } catch (error) {
      // Даже если запрос не удался, очищаем локальное состояние
      logout();
      toast.success('Вы вышли из системы');
      window.location.href = '/login';
    }
  };

  return (
    <div className={clsx('header', className)}>
      <div className="flex items-center gap-3">
        {/* Mobile close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        )}

        {/* User info */}
        <div className="flex items-center gap-3 flex-1 min-w-0 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 flex-1 min-w-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Avatar
              src={user?.avatar}
              name={user?.fullName || user?.email}
              size="md"
              status="online"
            />
            <div className="min-w-0 flex-1 text-left">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                {user?.fullName || `${user?.firstName} ${user?.lastName}` || 'Пользователь'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user?.position || user?.email}
              </p>
            </div>
          </button>

          {/* User menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {user?.fullName || `${user?.firstName} ${user?.lastName}` || 'Пользователь'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  {user?.organization && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {user.organization}
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    // Здесь можно добавить функционал профиля
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  Настройки профиля
                </button>
                
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                
                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из системы
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme switcher */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="relative"
          >
            <ThemeIcon className="w-5 h-5" />
          </Button>

          {showThemeMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowThemeMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
                {themeOptions.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTheme(key as any);
                      setShowThemeMenu(false);
                    }}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                      theme === key && 'bg-gray-100 dark:bg-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* New chat button */}
        <Button variant="ghost" size="sm">
          <Edit className="w-5 h-5" />
        </Button>

        {/* Settings button */}
        <Button variant="ghost" size="sm">
          <Settings className="w-5 h-5" />
        </Button>

        {/* Menu button for mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
