import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { useAuthStore } from '../../../stores/auth.store';
import { useFinanceStore } from '../../../stores/finance.store';

// Mock stores
vi.mock('../../../stores/auth.store');
vi.mock('../../../stores/finance.store');

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' })
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Sidebar Component', () => {
  const mockUser = {
    id: 'user-1',
    firstName: 'Хасенхан',
    lastName: 'Казимов',
    email: 'khasenkhan@cube.kz',
    role: 'admin' as const,
    position: 'Управляющий партнёр',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: mockUser,
      logout: vi.fn(),
    });
    (useFinanceStore as any).mockReturnValue({
      shareholderTotals: { khasenkhan: 100000, adil: 100000, azamat: 50000 },
    });
  });

  describe('Rendering', () => {
    it('должен отрендерить основные элементы навигации', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Главная')).toBeInTheDocument();
      expect(screen.getByText('Чат')).toBeInTheDocument();
      expect(screen.getByText('Звонки')).toBeInTheDocument();
      expect(screen.getByText('Задачи')).toBeInTheDocument();
    });

    it('должен применить правильную ширину для desktop', () => {
      const { container } = render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('w-72');
    });

    it('должен применить полную ширину для mobile', () => {
      const { container } = render(
        <TestWrapper>
          <Sidebar isMobile={true} />
        </TestWrapper>
      );

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('w-full');
    });
  });

  describe('Navigation', () => {
    it('должен навигировать при клике на пункт меню', async () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Звонки'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/calls');
      });
    });

    it('должен вызвать onClose при навигации в mobile режиме', async () => {
      const mockOnClose = vi.fn();

      render(
        <TestWrapper>
          <Sidebar isMobile={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Главная'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Role-based Access', () => {
    it('должен показать финансовые разделы для admin', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Касса')).toBeInTheDocument();
      expect(screen.getByText('Финансы')).toBeInTheDocument();
    });

    it('должен показать финансовые разделы для manager', () => {
      (useAuthStore as any).mockReturnValue({
        user: { ...mockUser, role: 'manager' },
        logout: vi.fn(),
      });

      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Касса')).toBeInTheDocument();
      expect(screen.getByText('Финансы')).toBeInTheDocument();
    });

    it('должен скрыть финансовые разделы для employee', () => {
      (useAuthStore as any).mockReturnValue({
        user: { ...mockUser, role: 'employee' },
        logout: vi.fn(),
      });

      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.queryByText('Касса')).not.toBeInTheDocument();
      expect(screen.queryByText('Финансы')).not.toBeInTheDocument();
    });
  });

  describe('User Info', () => {
    it('должен показать имя пользователя', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Хасенхан Казимов')).toBeInTheDocument();
    });

    it('должен показать должность пользователя', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Управляющий партнёр')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('должен применить мобильные стили', () => {
      const { container } = render(
        <TestWrapper>
          <Sidebar isMobile={true} />
        </TestWrapper>
      );

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('w-full');
    });

    it('должен вызвать onClose для мобильной версии', async () => {
      const mockOnClose = vi.fn();

      render(
        <TestWrapper>
          <Sidebar isMobile={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Главная'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
