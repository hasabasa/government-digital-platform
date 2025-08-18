import React from 'react';
import { clsx } from 'clsx';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../sidebar/Sidebar';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  className?: string;
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ className, children }) => {
  const [showSidebar, setShowSidebar] = React.useState(false);
  const location = useLocation();
  
  // Show sidebar by default on desktop for non-chat pages
  const isChat = location.pathname === '/chat';

  return (
    <div className={clsx('flex h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* Sidebar */}
      <div
        className={clsx(
          'lg:relative lg:flex lg:flex-shrink-0',
          // Mobile: overlay behavior
          'fixed inset-y-0 left-0 z-50 lg:z-auto',
          'transform transition-transform duration-300 ease-in-out lg:transform-none',
          showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Allow clicks on desktop always; disable only on mobile when hidden
          showSidebar
            ? 'pointer-events-auto'
            : 'pointer-events-none lg:pointer-events-auto'
        )}
      >
        <Sidebar 
          isMobile={true}
          onClose={() => setShowSidebar(false)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-0">
        {/* Mobile menu button */}
        <button
          onClick={() => setShowSidebar(true)}
          className={clsx(
            'fixed top-4 left-4 z-30 lg:hidden',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'rounded-lg p-2 shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
