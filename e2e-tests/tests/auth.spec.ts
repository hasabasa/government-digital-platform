import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the login page with Cube Demper branding', async ({ page }) => {
    await expect(page).toHaveTitle(/Cube Demper/);
    await expect(page.getByText('Cube Demper OS')).toBeVisible();
    await expect(page.getByText('Войти в аккаунт')).toBeVisible();
  });

  test('should show email and password fields on login form', async ({ page }) => {
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Пароль/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Войти/i })).toBeVisible();
  });

  test('should show validation errors for empty login form submission', async ({ page }) => {
    await page.getByRole('button', { name: /Войти/i }).click();

    await expect(page.getByText(/Введите email/i)).toBeVisible();
    await expect(page.getByText(/Введите пароль/i)).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('not-an-email');
    await page.getByLabel(/Пароль/i).fill('password123');
    await page.getByRole('button', { name: /Войти/i }).click();

    await expect(page.getByText(/Некорректный email/i)).toBeVisible();
  });

  test('should show error on wrong credentials', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Неверный email или пароль',
        }),
      });
    });

    await page.getByLabel(/Email/i).fill('wrong@example.com');
    await page.getByLabel(/Пароль/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Войти/i }).click();

    await expect(page.getByText(/Неверный email или пароль/i)).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-jwt-token',
            user: {
              id: 'user-1',
              name: 'Иван Петров',
              email: 'ivan@cubedemper.com',
              role: 'manager',
            },
          },
        }),
      });
    });

    await page.getByLabel(/Email/i).fill('ivan@cubedemper.com');
    await page.getByLabel(/Пароль/i).fill('securepassword');
    await page.getByRole('button', { name: /Войти/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Иван Петров')).toBeVisible();
  });

  test('should have a link to the registration page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Регистрация/i })).toBeVisible();
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display the registration form with Cube Demper branding', async ({ page }) => {
    await expect(page.getByText('Cube Demper OS')).toBeVisible();
    await expect(page.getByText(/Создать аккаунт/i)).toBeVisible();
  });

  test('should show required registration fields', async ({ page }) => {
    await expect(page.getByLabel(/Имя/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Пароль/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Зарегистрироваться/i })).toBeVisible();
  });

  test('should show validation errors for empty registration submission', async ({ page }) => {
    await page.getByRole('button', { name: /Зарегистрироваться/i }).click();

    await expect(page.getByText(/Введите имя/i)).toBeVisible();
    await expect(page.getByText(/Введите email/i)).toBeVisible();
    await expect(page.getByText(/Введите пароль/i)).toBeVisible();
  });

  test('should show error when password is too short', async ({ page }) => {
    await page.getByLabel(/Имя/i).fill('Тестовый Пользователь');
    await page.getByLabel(/Email/i).fill('test@cubedemper.com');
    await page.getByLabel(/Пароль/i).fill('123');
    await page.getByRole('button', { name: /Зарегистрироваться/i }).click();

    await expect(page.getByText(/Минимум 6 символов/i)).toBeVisible();
  });

  test('should register successfully and redirect to dashboard', async ({ page }) => {
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-jwt-token',
            user: {
              id: 'user-new',
              name: 'Новый Пользователь',
              email: 'new@cubedemper.com',
              role: 'employee',
            },
          },
        }),
      });
    });

    await page.getByLabel(/Имя/i).fill('Новый Пользователь');
    await page.getByLabel(/Email/i).fill('new@cubedemper.com');
    await page.getByLabel(/Пароль/i).fill('securepassword');
    await page.getByRole('button', { name: /Зарегистрироваться/i }).click();

    await expect(page).toHaveURL('/dashboard');
  });

  test('should have a link back to the login page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Войти/i })).toBeVisible();
  });
});

test.describe('Quick Demo Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show quick demo login buttons for all roles', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Демо: Admin/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Демо: Manager/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Демо: Employee/i })).toBeVisible();
  });

  test('should log in as admin via demo button', async ({ page }) => {
    await page.route('**/api/auth/demo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-admin-token',
            user: {
              id: 'demo-admin',
              name: 'Демо Админ',
              email: 'admin@cubedemper.com',
              role: 'admin',
            },
          },
        }),
      });
    });

    await page.getByRole('button', { name: /Демо: Admin/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Демо Админ')).toBeVisible();
  });

  test('should log in as manager via demo button', async ({ page }) => {
    await page.route('**/api/auth/demo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-manager-token',
            user: {
              id: 'demo-manager',
              name: 'Демо Менеджер',
              email: 'manager@cubedemper.com',
              role: 'manager',
            },
          },
        }),
      });
    });

    await page.getByRole('button', { name: /Демо: Manager/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Демо Менеджер')).toBeVisible();
  });

  test('should log in as employee via demo button', async ({ page }) => {
    await page.route('**/api/auth/demo', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'mock-employee-token',
            user: {
              id: 'demo-employee',
              name: 'Демо Сотрудник',
              email: 'employee@cubedemper.com',
              role: 'employee',
            },
          },
        }),
      });
    });

    await page.getByRole('button', { name: /Демо: Employee/i }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Демо Сотрудник')).toBeVisible();
  });
});

test.describe('Dashboard Access', () => {
  test('should redirect unauthenticated user to login page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should show dashboard for authenticated user', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        name: 'Иван Петров',
        email: 'ivan@cubedemper.com',
        role: 'manager',
      }));
    });

    await page.goto('/dashboard');
    await expect(page.getByText('Главная')).toBeVisible();
    await expect(page.getByText('Чат')).toBeVisible();
    await expect(page.getByText('Задачи')).toBeVisible();
  });
});

test.describe('Role-based Access', () => {
  test('should show admin features for admin role', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'admin-1',
        name: 'Админ Тестовый',
        email: 'admin@cubedemper.com',
        role: 'admin',
      }));
    });

    await page.goto('/dashboard');

    await expect(page.getByText('Управление пользователями')).toBeVisible();
    await expect(page.getByText('Настройки системы')).toBeVisible();
  });

  test('should show management features for manager role', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'manager-1',
        name: 'Менеджер Тестовый',
        email: 'manager@cubedemper.com',
        role: 'manager',
      }));
    });

    await page.goto('/dashboard');

    await expect(page.getByText('Задачи')).toBeVisible();
    await expect(page.getByText('Создать задачу')).toBeVisible();
    await expect(page.getByText('Управление пользователями')).not.toBeVisible();
  });

  test('should hide admin and management features for employee role', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'employee-1',
        name: 'Сотрудник Обычный',
        email: 'employee@cubedemper.com',
        role: 'employee',
      }));
    });

    await page.goto('/dashboard');

    await expect(page.getByText('Управление пользователями')).not.toBeVisible();
    await expect(page.getByText('Настройки системы')).not.toBeVisible();
  });
});

test.describe('Logout', () => {
  test('should log out and redirect to login page', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        name: 'Иван Петров',
        email: 'ivan@cubedemper.com',
        role: 'manager',
      }));
    });

    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Выйти/i }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Cube Demper OS')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        name: 'Тест Пользователь',
        email: 'test@cubedemper.com',
        role: 'employee',
      }));
    });

    await page.goto('/dashboard');

    // Sidebar should be hidden on mobile
    await expect(page.getByRole('navigation')).not.toBeVisible();

    // Menu button should be visible
    await expect(page.getByRole('button', { name: /меню/i })).toBeVisible();
  });

  test('should open mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        name: 'Тест Пользователь',
        email: 'test@cubedemper.com',
        role: 'employee',
      }));
    });

    await page.goto('/dashboard');

    // Open mobile menu
    await page.getByRole('button', { name: /меню/i }).click();

    // Sidebar should become visible
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByText('Главная')).toBeVisible();
  });

  test('should show login form correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByText('Cube Demper OS')).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Пароль/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Войти/i })).toBeVisible();
  });
});
