import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { AnomalyItem } from '../../types/api.types';
import { unwrapApiResponse } from '../../types/api.types';

/**
 * Hook React Query pour récupérer les anomalies d'un projet.
 * @param projectId - ID du projet
 */
export function useAnomalies(projectId: number | null) {
  return useQuery<AnomalyItem[]>({
    queryKey: ['anomalies', projectId],
    queryFn: async () => {
      const res = await apiService.getAnomalies(projectId!);
      return unwrapApiResponse(res);
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}
