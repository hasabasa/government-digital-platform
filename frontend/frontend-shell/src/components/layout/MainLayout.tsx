import React from 'react';
import { clsx } from 'clsx';
import { Sidebar } from '../sidebar/Sidebar';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  className?: string;
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ className, children }) => {
  const [showSidebar, setShowSidebar] = React.useState(true);

  return (
    <div className={clsx('flex h-screen bg-[#0e1621]', className)}>
      {/* Sidebar */}
      {showSidebar && (
        <div className="relative flex-shrink-0 z-50 lg:z-auto">
          <Sidebar
            isMobile={false}
            onClose={() => setShowSidebar(false)}
          />
        </div>
      )}

      {/* Mobile overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-0">
        {/* Toggle sidebar button (visible when sidebar is hidden) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className={clsx(
              'fixed top-3 left-3 z-30',
              'bg-[#17212b] border border-[#232e3c]',
              'rounded-xl p-2.5 shadow-lg shadow-black/50',
              'focus:outline-none focus:ring-2 focus:ring-[#3a73b8]',
              'text-[#adb5bd] hover:text-white transition-colors'
            )}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
