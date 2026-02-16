import React from 'react';
import { clsx } from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useFinanceStore } from '../../stores/finance.store';
import { useSidebarStore } from '../../stores/sidebar.store';
import {
  Home,
  MessageSquare,
  Phone,
  Banknote,
  BarChart3,
  LogOut,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  UserPlus,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  isMobile = false,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { shareholderTotals } = useFinanceStore();
  const { collapsed, toggle } = useSidebarStore();

  // On mobile always show expanded
  const isCollapsed = isMobile ? false : collapsed;

  // Role check: finance & cashier only for admin/manager
  const isFinanceAllowed = user?.role === 'admin' || user?.role === 'manager';

  const allNavigationItems = [
    { id: 'dashboard', label: 'Главная', path: '/', icon: Home },
    { id: 'chat', label: 'Чат', path: '/chat', icon: MessageSquare, badge: 3 },
    { id: 'calls', label: 'Звонки', path: '/calls', icon: Phone },
    { id: 'tasks', label: 'Задачи', path: '/orders', icon: ListTodo, badge: 5 },
    { id: 'contacts', label: 'Контакты', path: '/contacts', icon: UserPlus },
    { id: 'groups', label: 'Группы', path: '/groups', icon: Users },
    { id: 'cashier', label: 'Касса', path: '/cashier', icon: Banknote, requiresFinance: true },
    { id: 'finance', label: 'Финансы', path: '/finance', icon: BarChart3, requiresFinance: true },
  ];

  const navigationItems = allNavigationItems.filter(
    (item) => !item.requiresFinance || isFinanceAllowed
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';

  const totalBalance = Object.values(shareholderTotals).reduce((a, b) => a + b, 0);

  return (
    <div
      className={clsx(
        'flex flex-col h-full bg-[#17212b] border-r border-[#232e3c] transition-all duration-200',
        isCollapsed ? 'w-[52px]' : isMobile ? 'w-full' : 'w-64',
        className
      )}
    >
      {/* === Header === */}
      <div className={clsx('border-b border-[#232e3c] flex items-center', isCollapsed ? 'px-1.5 py-3 justify-center' : 'px-3 py-3')}>
        {isCollapsed ? (
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-[#6c7883] hover:text-white hover:bg-[#232e3c] transition-colors"
            title="Развернуть (⌘B)"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <img
              src={new URL('../../assets/logo-white.svg', import.meta.url).href}
              alt="Cube Demper"
              className="h-7"
            />
            <button
              onClick={isMobile ? onClose : toggle}
              className="p-1.5 rounded-lg text-[#6c7883] hover:text-white hover:bg-[#232e3c] transition-colors"
              title={isMobile ? 'Закрыть' : 'Свернуть (⌘B)'}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* === Navigation === */}
      <div className="flex-1 overflow-y-auto chat-scrollbar py-2">
        <nav className={clsx('space-y-0.5', isCollapsed ? 'px-1' : 'px-2')}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={clsx(
                    'w-full flex items-center rounded-lg transition-all duration-150',
                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                    isActive
                      ? 'bg-[#3a73b8] text-white'
                      : 'text-[#adb5bd] hover:bg-[#232e3c] hover:text-white'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className="w-5 h-5" />
                    {/* Badge dot in collapsed mode */}
                    {isCollapsed && item.badge && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold px-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold px-1.5">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* Tooltip in collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-[#232e3c] text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg shadow-black/30">
                    {item.label}
                    {item.badge && item.badge > 0 && (
                      <span className="ml-1.5 text-red-400">({item.badge})</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* === Quick Finance Stats (expanded only) === */}
        {!isCollapsed && isFinanceAllowed && totalBalance > 0 && (
          <div className="mx-3 mt-4 p-3 bg-[#232e3c] rounded-xl">
            <p className="text-[10px] text-[#6c7883] uppercase tracking-wider mb-2">Баланс</p>
            <p className="text-sm font-bold text-white tabular-nums">{formatMoney(totalBalance)}</p>
            <div className="flex gap-1 mt-2">
              {Object.entries(shareholderTotals).map(([name, amount]) => (
                <div
                  key={name}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    backgroundColor:
                      name === 'khasenkhan'
                        ? 'rgb(96, 165, 250)'
                        : name === 'adil'
                          ? 'rgb(167, 139, 250)'
                          : 'rgb(251, 191, 36)',
                    opacity: totalBalance > 0 ? Math.max(0.3, amount / totalBalance) : 0.3,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === Bottom: User === */}
      <div className={clsx('border-t border-[#232e3c]', isCollapsed ? 'p-1.5' : 'p-3')}>
        {isCollapsed ? (
          <div className="relative group">
            <button
              onClick={() => handleNavigate('/profile')}
              className="flex justify-center w-full"
              title="Профиль"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {user?.firstName?.[0] || 'C'}
                  {user?.lastName?.[0] || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#17212b] rounded-full" />
              </div>
            </button>
            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-[#232e3c] text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg shadow-black/30">
              {user?.firstName || 'Cube'} {user?.lastName || 'User'}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate('/profile')}
              className="relative flex-shrink-0"
              title="Профиль"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0] || 'C'}
                {user?.lastName?.[0] || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#17212b] rounded-full" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {user?.firstName || 'Cube'} {user?.lastName || 'User'}
              </p>
              <p className="text-xs text-[#6c7883] truncate">
                {user?.position || 'В сети'}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-[#6c7883] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-[#232e3c]"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
