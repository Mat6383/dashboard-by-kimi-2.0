import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

export interface AnomalyItem {
  metric: string;
  value: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

/**
 * Hook React Query pour récupérer les anomalies d'un projet.
 * @param projectId - ID du projet
 */
export function useAnomalies(projectId: number | null) {
  return useQuery<AnomalyItem[]>({
    queryKey: ['anomalies', projectId],
    queryFn: async () => {
      const res = await apiService.getAnomalies(projectId!);
      return res.data ?? [];
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}
