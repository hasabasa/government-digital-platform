import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('должен отобразить страницу входа', async ({ page }) => {
    await expect(page).toHaveTitle(/Платформа госслужащих/);
    await expect(page.getByText('Добро пожаловать')).toBeVisible();
    await expect(page.getByText('ЭЦП вход')).toBeVisible();
    await expect(page.getByText('eGov Mobile')).toBeVisible();
  });

  test('должен показать модальное окно ECP при клике', async ({ page }) => {
    await page.getByRole('button', { name: /ЭЦП вход/i }).click();
    
    await expect(page.getByText('Электронная цифровая подпись')).toBeVisible();
    await expect(page.getByText('NCALayer')).toBeVisible();
    await expect(page.getByRole('button', { name: /Подключиться/i })).toBeVisible();
  });

  test('должен показать модальное окно eGov Mobile при клике', async ({ page }) => {
    await page.getByRole('button', { name: /eGov Mobile/i }).click();
    
    await expect(page.getByText('Авторизация через eGov Mobile')).toBeVisible();
    await expect(page.getByText('QR-код')).toBeVisible();
    await expect(page.getByRole('button', { name: /Сканировать QR-код/i })).toBeVisible();
  });

  test('должен обработать ошибку подключения NCALayer', async ({ page }) => {
    // Мокаем ошибку WebSocket
    await page.route('ws://localhost:13579', route => {
      route.abort();
    });

    await page.getByRole('button', { name: /ЭЦП вход/i }).click();
    await page.getByRole('button', { name: /Подключиться/i }).click();

    await expect(page.getByText(/Не удалось подключиться к NCALayer/i)).toBeVisible();
  });

  test('должен перенаправить на дашборд после успешной аутентификации', async ({ page }) => {
    // Мокаем успешную аутентификацию
    await page.route('**/api/auth/ecp/verify', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-jwt-token',
            user: {
              id: 'user-1',
              firstName: 'Тест',
              lastName: 'Пользователь',
              email: 'test@minfin.gov.kz',
              role: 'minister',
              organization: 'Министерство финансов'
            }
          }
        })
      });
    });

    await page.getByRole('button', { name: /ЭЦП вход/i }).click();
    await page.getByRole('button', { name: /Подключиться/i }).click();

    // Ждем перенаправления на дашборд
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Министерство финансов')).toBeVisible();
  });
});

test.describe('Dashboard Access', () => {
  test('должен перенаправить неаутентифицированного пользователя на страницу входа', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('должен показать дашборд для аутентифицированного пользователя', async ({ page }) => {
    // Устанавливаем токен в localStorage
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        firstName: 'Тест',
        lastName: 'Пользователь',
        email: 'test@minfin.gov.kz',
        role: 'minister',
        organization: 'Министерство финансов'
      }));
    });

    await page.goto('/dashboard');
    await expect(page.getByText('Главная')).toBeVisible();
    await expect(page.getByText('Каналы')).toBeVisible();
    await expect(page.getByText('Группы')).toBeVisible();
  });
});

test.describe('Role-based Access', () => {
  test('должен показать админские функции для руководителей', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'admin-1',
        firstName: 'Администратор',
        lastName: 'Тестовый',
        email: 'admin@gov.kz',
        role: 'minister',
        organization: 'Министерство финансов'
      }));
    });

    await page.goto('/dashboard');
    
    await expect(page.getByText('Задачи и поручения')).toBeVisible();
    await expect(page.getByText('Создать канал')).toBeVisible();
  });

  test('должен скрыть админские функции для обычных пользователей', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        firstName: 'Пользователь',
        lastName: 'Обычный',
        email: 'user@gov.kz',
        role: 'specialist',
        organization: 'Министерство финансов'
      }));
    });

    await page.goto('/dashboard');
    
    await expect(page.getByText('Задачи и поручения')).not.toBeVisible();
    await expect(page.getByText('Создать канал')).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('должен работать на мобильных устройствах', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        firstName: 'Тест',
        lastName: 'Пользователь',
        role: 'specialist'
      }));
    });

    await page.goto('/dashboard');
    
    // Сайдбар должен быть скрыт на мобильных
    await expect(page.getByRole('navigation')).not.toBeVisible();
    
    // Должна быть кнопка меню
    await expect(page.getByRole('button', { name: /меню/i })).toBeVisible();
  });

  test('должен открывать мобильное меню', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        firstName: 'Тест',
        lastName: 'Пользователь',
        role: 'specialist'
      }));
    });

    await page.goto('/dashboard');
    
    // Открываем мобильное меню
    await page.getByRole('button', { name: /меню/i }).click();
    
    // Сайдбар должен стать видимым
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText('Главная')).toBeVisible();
  });
});
