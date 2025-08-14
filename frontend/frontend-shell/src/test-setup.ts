import '@testing-library/jest-dom';
import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Глобальная настройка тестов
beforeAll(() => {
  // Мокаем window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Мокаем IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Мокаем ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Мокаем WebSocket
  global.WebSocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1, // OPEN
  }));

  // Мокаем localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Мокаем sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
  });

  // Мокаем URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mocked-url');
  global.URL.revokeObjectURL = vi.fn();

  // Мокаем fetch
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} }),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
    } as Response)
  );

  // Мокаем console для тестов
  const originalConsole = console;
  global.console = {
    ...originalConsole,
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
});

// Очистка после каждого теста
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Глобальные матчеры для тестов
expect.extend({
  toHaveAccessibleName(received) {
    const hasAccessibleName = 
      received.getAttribute('aria-label') ||
      received.getAttribute('aria-labelledby') ||
      received.getAttribute('title') ||
      received.textContent;

    return {
      message: () => 
        `expected element to have accessible name, but it ${hasAccessibleName ? 'has' : 'does not have'} one`,
      pass: !!hasAccessibleName,
    };
  },
});

// Типы для пользовательских матчеров
declare global {
  namespace Vi {
    interface Assertion {
      toHaveAccessibleName(): void;
    }
  }
}
