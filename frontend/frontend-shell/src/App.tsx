import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/auth.store';
import { useThemeStore } from './stores/theme.store';
import { LoginPage } from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FeedPage from './pages/FeedPage';
import ChatPage from './pages/ChatPage';
import GroupsPage from './pages/GroupsPage';
import CallsPage from './pages/CallsPage';
import OrdersPage from './pages/OrdersPage';
import { CashierPage } from './pages/CashierPage';
import { FinanceDashboardPage } from './pages/FinanceDashboardPage';
import { TestDashboard } from './pages/TestDashboard';
import { WebSocketProvider } from './providers/WebSocketProvider';
import './styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirect to main if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { theme } = useThemeStore();

  // Always dark mode for Cube OS
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    if (theme === 'dark' || true) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Test page - публичная для отладки */}
            <Route path="/test" element={<TestDashboard />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <DashboardPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <FeedPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <ChatPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <ChatPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <GroupsPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <GroupsPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/channels/:channelId"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <ChatPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/channels/create"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <GroupsPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/create"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <GroupsPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calls"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <CallsPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <OrdersPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <CashierPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <WebSocketProvider>
                    <FinanceDashboardPage />
                  </WebSocketProvider>
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to main */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
