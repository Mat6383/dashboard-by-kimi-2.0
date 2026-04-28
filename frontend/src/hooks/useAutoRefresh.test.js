import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoRefresh } from './useAutoRefresh';

const EMPTY_PREPROD = [];
const EMPTY_PROD = [];

describe('useAutoRefresh', () => {
  const mocks = {
    checkBackendHealth: vi.fn(),
    loadProjects: vi.fn(),
    loadDashboardMetrics: vi.fn(),
    isLoadingRef: { current: false },
    lastRefreshRef: { current: 0 },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(mocks).forEach((m) => {
      if (typeof m === 'function') m.mockReset();
    });
    mocks.isLoadingRef.current = false;
    mocks.lastRefreshRef.current = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('appelle checkBackendHealth, loadProjects et loadDashboardMetrics au montage', () => {
    renderHook(() =>
      useAutoRefresh({
        autoRefresh: false,
        ...mocks,
        projectId: 1,
        selectedPreprodMilestones: EMPTY_PREPROD,
        selectedProdMilestones: EMPTY_PROD,
      })
    );
    expect(mocks.checkBackendHealth).toHaveBeenCalledTimes(1);
    expect(mocks.loadProjects).toHaveBeenCalledTimes(1);
    expect(mocks.loadDashboardMetrics).toHaveBeenCalledWith(true);
  });

  it('recharge quand projectId change', () => {
    const { rerender } = renderHook(
      ({ projectId }) =>
        useAutoRefresh({
          autoRefresh: false,
          ...mocks,
          projectId,
          selectedPreprodMilestones: EMPTY_PREPROD,
          selectedProdMilestones: EMPTY_PROD,
        }),
      { initialProps: { projectId: 1 } }
    );
    const initialCalls = mocks.loadDashboardMetrics.mock.calls.length;

    rerender({ projectId: 2 });
    expect(mocks.loadDashboardMetrics.mock.calls.length).toBeGreaterThan(initialCalls);
    expect(mocks.loadDashboardMetrics).toHaveBeenLastCalledWith(true);
  });

  it('crée un intervalle quand autoRefresh est actif', () => {
    renderHook(() =>
      useAutoRefresh({
        autoRefresh: true,
        ...mocks,
        projectId: 1,
        selectedPreprodMilestones: EMPTY_PREPROD,
        selectedProdMilestones: EMPTY_PROD,
      })
    );
    const callsBefore = mocks.loadDashboardMetrics.mock.calls.length;
    vi.advanceTimersByTime(60000);
    expect(mocks.loadDashboardMetrics.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('ne crée pas d intervalle quand autoRefresh est inactif', () => {
    renderHook(() =>
      useAutoRefresh({
        autoRefresh: false,
        ...mocks,
        projectId: 1,
        selectedPreprodMilestones: EMPTY_PREPROD,
        selectedProdMilestones: EMPTY_PROD,
      })
    );
    const callsBefore = mocks.loadDashboardMetrics.mock.calls.length;
    vi.advanceTimersByTime(60000);
    expect(mocks.loadDashboardMetrics.mock.calls.length).toBe(callsBefore);
  });

  it('ne crée pas d intervalle quand liveConnected est true', () => {
    renderHook(() =>
      useAutoRefresh({
        autoRefresh: true,
        liveConnected: true,
        ...mocks,
        projectId: 1,
        selectedPreprodMilestones: EMPTY_PREPROD,
        selectedProdMilestones: EMPTY_PROD,
      })
    );
    const callsBefore = mocks.loadDashboardMetrics.mock.calls.length;
    vi.advanceTimersByTime(60000);
    expect(mocks.loadDashboardMetrics.mock.calls.length).toBe(callsBefore);
  });

  it('nettoie l intervalle au démontage', () => {
    const { unmount } = renderHook(() =>
      useAutoRefresh({
        autoRefresh: true,
        ...mocks,
        projectId: 1,
        selectedPreprodMilestones: EMPTY_PREPROD,
        selectedProdMilestones: EMPTY_PROD,
      })
    );
    const callsBefore = mocks.loadDashboardMetrics.mock.calls.length;
    unmount();
    vi.advanceTimersByTime(60000);
    expect(mocks.loadDashboardMetrics.mock.calls.length).toBe(callsBefore);
  });

  it('recharge au visibilitychange si cooldown respecté', () => {
    renderHook(() =>
      useAutoRefresh({
        autoRefresh: true,
        ...mocks,
        projectId: 1,
        selectedPreprodMilestones: EMPTY_PREPROD,
        selectedProdMilestones: EMPTY_PROD,
      })
    );
    mocks.lastRefreshRef.current = 0;
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
    const callsBefore = mocks.loadDashboardMetrics.mock.calls.length;
    window.dispatchEvent(new Event('visibilitychange'));
    expect(mocks.loadDashboardMetrics.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('ne recharge pas au visibilitychange si déjà en cours de chargement', () => {
    mocks.isLoadingRef.current = true;
    renderHook(() =>
      useAutoRefresh({
        autoRefresh: true,
        ...mocks,
        projectId: 1,
        selectedPreprodMilestones: EMPTY_PREPROD,
        selectedProdMilestones: EMPTY_PROD,
      })
    );
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
    const callsBefore = mocks.loadDashboardMetrics.mock.calls.length;
    window.dispatchEvent(new Event('visibilitychange'));
    expect(mocks.loadDashboardMetrics.mock.calls.length).toBe(callsBefore);
  });
});
