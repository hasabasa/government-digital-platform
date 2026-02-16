import React from 'react';
import { clsx } from 'clsx';
import { Sidebar } from '../sidebar/Sidebar';
import { useSidebarStore } from '../../stores/sidebar.store';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  className?: string;
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ className, children }) => {
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);
  const { toggle } = useSidebarStore();

  // Cmd+B / Ctrl+B to toggle sidebar
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return (
    <div className={clsx('flex h-screen bg-[#0e1621]', className)}>
      {/* Desktop Sidebar — always visible (collapsed or expanded) */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar isMobile={false} />
      </div>

      {/* Mobile Sidebar overlay */}
      {showMobileSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden">
            <Sidebar
              isMobile={true}
              onClose={() => setShowMobileSidebar(false)}
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with burger */}
        <div className="flex items-center bg-[#17212b] border-b border-[#232e3c] px-3 py-2 lg:hidden">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3a73b8] text-[#adb5bd] hover:text-white hover:bg-[#232e3c] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
