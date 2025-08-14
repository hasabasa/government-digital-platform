import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  actualTheme: 'light' | 'dark';
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getActualTheme = (theme: Theme): 'light' | 'dark' => {
  return theme === 'system' ? getSystemTheme() : theme;
};

const applyTheme = (actualTheme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  if (actualTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set, get) => ({
      // State
      theme: 'system',
      actualTheme: getSystemTheme(),

      // Actions
      setTheme: (theme) => {
        const actualTheme = getActualTheme(theme);
        set({ theme, actualTheme });
        applyTheme(actualTheme);
      },

      toggleTheme: () => {
        const { actualTheme } = get();
        const newTheme = actualTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme on initial load
          const actualTheme = getActualTheme(state.theme);
          state.actualTheme = actualTheme;
          applyTheme(actualTheme);

          // Listen for system theme changes
          if (typeof window !== 'undefined' && state.theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
              const newActualTheme = e.matches ? 'dark' : 'light';
              state.actualTheme = newActualTheme;
              applyTheme(newActualTheme);
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
          }
        }
      },
    }
  )
);
