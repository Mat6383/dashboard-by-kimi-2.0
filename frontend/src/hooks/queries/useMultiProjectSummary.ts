import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { MultiProjectSummaryItem } from '../../types/api.types';
import { unwrapApiResponse } from '../../types/api.types';

export const MULTI_PROJECT_SUMMARY_KEY = ['multi-project-summary'] as const;

/**
 * Hook React Query pour la synthèse multi-projets.
 */
export function useMultiProjectSummary() {
  return useQuery<MultiProjectSummaryItem[]>({
    queryKey: MULTI_PROJECT_SUMMARY_KEY,
    queryFn: async () => {
      const res = await apiService.getMultiProjectSummary();
      return unwrapApiResponse(res);
    },
    staleTime: 2 * 60 * 1000,
  });
}
