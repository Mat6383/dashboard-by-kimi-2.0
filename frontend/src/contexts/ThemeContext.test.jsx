import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, ThemeContext } from './ThemeContext';

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes dark mode from localStorage', () => {
    localStorage.setItem('testmo_darkMode', 'true');
    const { result } = renderHook(() => React.useContext(ThemeContext), { wrapper });
    expect(result.current.isDark).toBe(true);
  });

  it('defaults to light mode when localStorage is empty', () => {
    const { result } = renderHook(() => React.useContext(ThemeContext), { wrapper });
    expect(result.current.isDark).toBe(false);
  });

  it('toggles dark mode', () => {
    const { result } = renderHook(() => React.useContext(ThemeContext), { wrapper });
    act(() => result.current.toggleDark());
    expect(result.current.isDark).toBe(true);
    expect(localStorage.getItem('testmo_darkMode')).toBe('true');
  });

  it('initializes tv mode from localStorage', () => {
    localStorage.setItem('testmo_tvMode', 'false');
    const { result } = renderHook(() => React.useContext(ThemeContext), { wrapper });
    expect(result.current.tvMode).toBe(false);
  });

  it('defaults tv mode to true when localStorage is empty', () => {
    const { result } = renderHook(() => React.useContext(ThemeContext), { wrapper });
    expect(result.current.tvMode).toBe(true);
  });

  it('toggles tv mode', () => {
    const { result } = renderHook(() => React.useContext(ThemeContext), { wrapper });
    act(() => result.current.toggleTv());
    expect(result.current.tvMode).toBe(false);
    expect(localStorage.getItem('testmo_tvMode')).toBe('false');
  });
});
