import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

export const MULTI_PROJECT_SUMMARY_KEY = ['multi-project-summary'];

/**
 * Hook React Query pour la synthèse multi-projets.
 */
export function useMultiProjectSummary() {
  return useQuery({
    queryKey: MULTI_PROJECT_SUMMARY_KEY,
    queryFn: async () => {
      const res = await apiService.getMultiProjectSummary();
      return res.data ?? null;
    },
    staleTime: 2 * 60 * 1000,
  });
}
