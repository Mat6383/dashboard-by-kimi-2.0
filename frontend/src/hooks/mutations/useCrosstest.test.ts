import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSaveCrosstestComment, useDeleteCrosstestComment } from './useCrosstest';
import React from 'react';

const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../services/api.service', () => ({
  default: {
    saveCrosstestComment: (iid: number, comment: string, milestoneContext: string | null) =>
      mockPost(iid, comment, milestoneContext),
    deleteCrosstestComment: (iid: number) => mockDelete(iid),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useCrosstest mutations', () => {
  it('saves a comment', async () => {
    mockPost.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useSaveCrosstestComment(), { wrapper });

    result.current.mutate({ iid: 42, comment: 'LGTM', milestoneContext: 'R06' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPost).toHaveBeenCalledWith(42, 'LGTM', 'R06');
  });

  it('deletes a comment', async () => {
    mockDelete.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDeleteCrosstestComment(), { wrapper });

    result.current.mutate(42);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDelete).toHaveBeenCalledWith(42);
  });
});
