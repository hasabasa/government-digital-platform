import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { useAuthStore } from '../../../stores/auth.store';

// Mock stores
vi.mock('../../../stores/auth.store');

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
    firstName: 'Тест',
    lastName: 'Пользователь',
    email: 'test@minfin.gov.kz',
    role: 'minister' as const,
    organization: 'Министерство финансов'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: mockUser
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
      expect(screen.getByText('Лента новостей')).toBeInTheDocument();
      expect(screen.getByText('Звонки')).toBeInTheDocument();
      expect(screen.getByText('Задачи и поручения')).toBeInTheDocument();
    });

    it('должен отрендерить секции каналов, групп и личных чатов', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Каналы')).toBeInTheDocument();
      expect(screen.getByText('Группы')).toBeInTheDocument();
      expect(screen.getByText('Личные чаты')).toBeInTheDocument();
    });

    it('должен показать статус пользователя', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('В сети')).toBeInTheDocument();
      expect(screen.getByText('Министерство финансов')).toBeInTheDocument();
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
    it('должен показать админские функции для руководителей', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Задачи и поручения')).toBeInTheDocument();
      expect(screen.getByText('Создать канал')).toBeInTheDocument();
    });

    it('должен скрыть админские функции для обычных пользователей', () => {
      (useAuthStore as any).mockReturnValue({
        user: { ...mockUser, role: 'specialist' }
      });

      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.queryByText('Задачи и поручения')).not.toBeInTheDocument();
      expect(screen.queryByText('Создать канал')).not.toBeInTheDocument();
    });
  });

  describe('Channels Section', () => {
    it('должен отображать закрепленные каналы с иконкой Pin', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const pinnedChannels = screen.getAllByText('Общие объявления');
      expect(pinnedChannels.length).toBeGreaterThan(0);
    });

    it('должен показать индикаторы непрочитанных сообщений', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Проверяем наличие синих точек для непрочитанных
      const unreadIndicators = document.querySelectorAll('.bg-blue-500');
      expect(unreadIndicators.length).toBeGreaterThan(0);
    });

    it('должен разворачивать и сворачивать секцию каналов', async () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const channelsHeader = screen.getByText('Каналы');
      const channelsButton = channelsHeader.closest('button');

      expect(screen.getByText('Общие объявления')).toBeInTheDocument();

      if (channelsButton) {
        fireEvent.click(channelsButton);
        
        await waitFor(() => {
          expect(screen.queryByText('Общие объявления')).not.toBeInTheDocument();
        });
      }
    });

    it('должен навигировать к каналу при клике', async () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Министерство финансов'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/channels/ministry-finance');
      });
    });
  });

  describe('Groups Section', () => {
    it('должен отображать группы с количеством участников', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Проект "Цифровизация"')).toBeInTheDocument();
      expect(screen.getByText('12 участников')).toBeInTheDocument();
    });

    it('должен показать индикатор активного звонка', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Ищем группу с активным звонком
      const groupsSection = screen.getByText('Планирование бюджета').closest('.group');
      expect(groupsSection?.querySelector('[data-testid="video-icon"]')).toBeInTheDocument();
    });

    it('должен навигировать к группе при клике', async () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Планирование бюджета'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/groups/budget-planning');
      });
    });

    it('должен показать кнопку создания группы', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Создать группу')).toBeInTheDocument();
    });
  });

  describe('Direct Messages Section', () => {
    it('должен отображать личные чаты с аватарами', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Асылбек Нурланов')).toBeInTheDocument();
      expect(screen.getByText('Министр финансов')).toBeInTheDocument();
    });

    it('должен показать статус онлайн пользователей', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Ищем зеленые индикаторы онлайн статуса
      const onlineIndicators = document.querySelectorAll('.bg-green-500');
      expect(onlineIndicators.length).toBeGreaterThan(0);
    });

    it('должен отображать время последнего сообщения', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('15:30')).toBeInTheDocument();
      expect(screen.getByText('14:45')).toBeInTheDocument();
    });

    it('должен навигировать к чату при клике', async () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Асылбек Нурланов'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/chat/user-1');
      });
    });

    it('должен генерировать правильные инициалы для аватаров', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('АН')).toBeInTheDocument(); // Асылбек Нурланов
      expect(screen.getByText('ГК')).toBeInTheDocument(); // Гульнара Касымова
    });
  });

  describe('Section Expansion/Collapse', () => {
    it('должен разворачивать и сворачивать все секции независимо', async () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Получаем кнопки секций
      const channelsButton = screen.getByText('Каналы').closest('button');
      const groupsButton = screen.getByText('Группы').closest('button');
      const chatsButton = screen.getByText('Личные чаты').closest('button');

      // Проверяем, что контент изначально видим
      expect(screen.getByText('Общие объявления')).toBeInTheDocument();
      expect(screen.getByText('Проект "Цифровизация"')).toBeInTheDocument();
      expect(screen.getByText('Асылбек Нурланов')).toBeInTheDocument();

      // Сворачиваем каналы
      if (channelsButton) {
        fireEvent.click(channelsButton);
        await waitFor(() => {
          expect(screen.queryByText('Общие объявления')).not.toBeInTheDocument();
        });
      }

      // Группы и чаты должны остаться развернутыми
      expect(screen.getByText('Проект "Цифровизация"')).toBeInTheDocument();
      expect(screen.getByText('Асылбек Нурланов')).toBeInTheDocument();
    });

    it('должен показать правильные иконки chevron', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      // Изначально все секции развернуты - должны быть ChevronDown иконки
      const chevronDowns = document.querySelectorAll('[data-testid="chevron-down"]');
      expect(chevronDowns.length).toBeGreaterThan(0);
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

  describe('Accessibility', () => {
    it('должен иметь правильные ARIA атрибуты', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const navElement = document.querySelector('nav');
      expect(navElement).toBeInTheDocument();

      // Проверяем, что кнопки имеют доступные имена
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('должен поддерживать клавиатурную навигацию', () => {
      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      const firstButton = screen.getByText('Главная');
      expect(firstButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Error Handling', () => {
    it('должен работать без пользователя', () => {
      (useAuthStore as any).mockReturnValue({
        user: null
      });

      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Платформа госслужащих')).toBeInTheDocument();
    });

    it('должен работать без организации пользователя', () => {
      (useAuthStore as any).mockReturnValue({
        user: { ...mockUser, organization: null }
      });

      render(
        <TestWrapper>
          <Sidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Министерство финансов')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('должен применить темные стили', () => {
      const { container } = render(
        <TestWrapper>
          <Sidebar className="dark" />
        </TestWrapper>
      );

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('dark:bg-gray-800');
    });
  });
});
