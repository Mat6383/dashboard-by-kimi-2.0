import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClearCache } from './useCache';
import React from 'react';

const mockPost = vi.fn();

vi.mock('../../services/api.service', () => ({
  default: {
    clearCache: () => mockPost(),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useClearCache', () => {
  it('calls clearCache mutation', async () => {
    mockPost.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useClearCache(), { wrapper });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledTimes(1);
  });
});
