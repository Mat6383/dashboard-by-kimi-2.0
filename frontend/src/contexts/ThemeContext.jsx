import React, { createContext, useState, useCallback, useEffect, useMemo } from 'react';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('testmo_darkMode') === 'true');
  const [tvMode, setTvMode] = useState(() => localStorage.getItem('testmo_tvMode') !== 'false');

  const toggleDark = useCallback(() => setIsDark((prev) => !prev), []);
  const toggleTv = useCallback(() => setTvMode((prev) => !prev), []);

  useEffect(() => {
    try {
      localStorage.setItem('testmo_darkMode', isDark);
      localStorage.setItem('testmo_tvMode', tvMode);
    } catch (err) {
      console.warn('localStorage quota exceeded:', err);
    }
  }, [isDark, tvMode]);

  // Sync cross-onglets via événement storage
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'testmo_darkMode') {
        setIsDark(e.newValue === 'true');
      }
      if (e.key === 'testmo_tvMode') {
        setTvMode(e.newValue !== 'false');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(() => ({ isDark, toggleDark, tvMode, toggleTv }), [isDark, toggleDark, tvMode, toggleTv]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
