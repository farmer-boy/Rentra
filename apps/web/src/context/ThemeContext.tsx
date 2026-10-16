import React, { useEffect, useState } from 'react';
import { ThemeContext, type ThemeMode } from './theme-context';

const readThemeMode = (): ThemeMode => {
  try {
    if (typeof localStorage === 'undefined') return 'light';
    const savedMode = localStorage.getItem('themeMode');
    return savedMode === 'light' || savedMode === 'dark' || savedMode === 'device'
      ? savedMode
      : 'light';
  } catch (error) {
    console.warn('Unable to read the saved display preference.', error);
    return 'light';
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(readThemeMode);
  const [deviceIsDark, setDeviceIsDark] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const isDark =
    themeMode === 'dark' || (themeMode === 'device' && deviceIsDark);

  useEffect(() => {
    if (themeMode !== 'device') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateDeviceTheme = (event: MediaQueryListEvent) =>
      setDeviceIsDark(event.matches);
    mediaQuery.addEventListener('change', updateDeviceTheme);
    return () => mediaQuery.removeEventListener('change', updateDeviceTheme);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light',
    );
  }, [isDark]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('themeMode', mode);
    } catch (error) {
      console.warn('Unable to save the display preference.', error);
    }
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{ themeMode, setThemeMode, isDark, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
