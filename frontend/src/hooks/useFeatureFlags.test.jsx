import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFeatureFlags } from './useFeatureFlags';

const mockGet = vi.fn();
const mockPut = vi.fn();

vi.mock('../services/api.service', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    put: (...args) => mockPut(...args),
  },
}));

describe('useFeatureFlags', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPut.mockReset();
  });

  it('récupère tous les flags', async () => {
    mockGet.mockResolvedValue({ data: { data: { annualTrendsV2: true, crosstestBulkEdit: false } } });
    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.flags).toEqual({ annualTrendsV2: true, crosstestBulkEdit: false });
  });

  it('récupère un flag spécifique', async () => {
    mockGet.mockResolvedValue({ data: { data: { key: 'annualTrendsV2', enabled: true } } });
    const { result } = renderHook(() => useFeatureFlags('annualTrendsV2'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.flags).toBe(true);
  });

  it('toggle met à jour un flag', async () => {
    mockGet.mockResolvedValue({ data: { data: { annualTrendsV2: false } } });
    mockPut.mockResolvedValue({});

    const { result } = renderHook(() => useFeatureFlags());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.toggle('annualTrendsV2', true);
    expect(mockPut).toHaveBeenCalledWith('/feature-flags/annualTrendsV2', { enabled: true });
    await waitFor(() => expect(result.current.flags.annualTrendsV2).toBe(true));
  });
});
