import React, { createContext, useState, useCallback, useEffect } from 'react';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('testmo_darkMode') === 'true');
  const [tvMode, setTvMode] = useState(() => localStorage.getItem('testmo_tvMode') !== 'false');

  const toggleDark = useCallback(() => setIsDark(prev => !prev), []);
  const toggleTv = useCallback(() => setTvMode(prev => !prev), []);

  useEffect(() => {
    localStorage.setItem('testmo_darkMode', isDark);
    localStorage.setItem('testmo_tvMode', tvMode);
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

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, tvMode, toggleTv }}>
      {children}
    </ThemeContext.Provider>
  );
}
