'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // On mount, check for saved preference or system preference
  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem('bricknote-theme') as Theme | null;
      if (saved && (saved === 'light' || saved === 'dark')) {
        setTheme(saved);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (e) {
      // localStorage might not be available
      console.error('Error reading theme from localStorage:', e);
    }
  }, []);

  // Apply theme to document whenever theme changes
  useEffect(() => {
    if (!mounted) return;

    // Apply to html element
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Also set a data attribute as fallback
    root.setAttribute('data-theme', theme);

    try {
      localStorage.setItem('bricknote-theme', theme);
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      console.log('Theme toggled from', prev, 'to', newTheme);
      return newTheme;
    });
  }, []);

  // Prevent flash by not rendering until mounted
  // But still render children to avoid layout shift
  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
