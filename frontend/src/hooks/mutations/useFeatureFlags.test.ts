import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateFeatureFlag, useUpdateFeatureFlag, useDeleteFeatureFlag } from './useFeatureFlags';
import React from 'react';

const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../services/api.service', () => ({
  default: {
    createFeatureFlag: (data: unknown) => mockPost(data),
    updateFeatureFlag: (key: string, data: unknown) => mockPut(key, data),
    deleteFeatureFlag: (key: string) => mockDelete(key),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useFeatureFlags mutations', () => {
  it('creates a feature flag', async () => {
    mockPost.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useCreateFeatureFlag(), { wrapper });

    result.current.mutate({ key: 'new-flag', enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith({ key: 'new-flag', enabled: true });
  });

  it('updates a feature flag', async () => {
    mockPut.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useUpdateFeatureFlag(), { wrapper });

    result.current.mutate({ key: 'existing-flag', data: { enabled: false } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPut).toHaveBeenCalledWith('existing-flag', { enabled: false });
  });

  it('deletes a feature flag', async () => {
    mockDelete.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDeleteFeatureFlag(), { wrapper });

    result.current.mutate('old-flag');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDelete).toHaveBeenCalledWith('old-flag');
  });
});
