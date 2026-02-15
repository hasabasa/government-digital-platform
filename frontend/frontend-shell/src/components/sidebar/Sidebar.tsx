import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useFinanceStore } from '../../stores/finance.store';
import {
  Home,
  MessageSquare,
  Phone,
  Banknote,
  BarChart3,
  LogOut,
  Search,
  ListTodo,
  X,
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



  const [searchQuery, setSearchQuery] = useState('');

  // Role check: finance & cashier only for admin/manager
  const isFinanceAllowed = user?.role === 'admin' || user?.role === 'manager';

  // === Навигация ===
  const allNavigationItems = [
    { id: 'dashboard', label: 'Главная', path: '/', icon: Home },
    { id: 'cashier', label: 'Касса', path: '/cashier', icon: Banknote, requiresFinance: true },
    { id: 'finance', label: 'Финансы', path: '/finance', icon: BarChart3, requiresFinance: true },
    { id: 'tasks', label: 'Задачи', path: '/orders', icon: ListTodo },
    { id: 'chat', label: 'Чат', path: '/chat', icon: MessageSquare },
    { id: 'calls', label: 'Звонки', path: '/calls', icon: Phone },
  ];

  const navigationItems = allNavigationItems.filter(
    (item) => !item.requiresFinance || isFinanceAllowed
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
  };

  // Быстрая сводка баланса
  const totalBalance = Object.values(shareholderTotals).reduce((a, b) => a + b, 0);

  return (
    <div
      className={clsx(
        'flex flex-col h-full bg-[#17212b] border-r border-[#232e3c]',
        isMobile ? 'w-full' : 'w-72',
        className
      )}
    >
      {/* === Header === */}
      <div className="px-4 py-3 border-b border-[#232e3c]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img
              src={new URL('../assets/logo-white.svg', import.meta.url).href}
              alt="Cube Demper"
              className="h-8"
            />
          </div>
          {onClose && (
            <button onClick={onClose} className="text-[#6c7883] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242f3d] text-white text-sm rounded-lg pl-9 pr-3 py-2 placeholder:text-[#6c7883] focus:outline-none focus:ring-1 focus:ring-[#3a73b8] transition-all"
          />
        </div>
      </div>

      {/* === Navigation Items === */}
      <div className="flex-1 overflow-y-auto chat-scrollbar py-2">
        <nav className="px-2 space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150',
                  isActive
                    ? 'bg-[#3a73b8] text-white'
                    : 'text-[#adb5bd] hover:bg-[#232e3c] hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>

                {/* Бейджи для Кассы */}
                {item.id === 'cashier' && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                    HOT
                  </span>
                )}
              </button>
            );
          })}
        </nav>



        {/* === Quick Finance Stats (admin/manager only) === */}
        {isFinanceAllowed && totalBalance > 0 && (
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

      {/* === Bottom Section: User Info === */}
      <div className="border-t border-[#232e3c] p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.firstName?.[0] || 'C'}
              {user?.lastName?.[0] || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#17212b] rounded-full" />
          </div>
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
            className="text-[#6c7883] hover:text-red-400 transition-colors p-1"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
