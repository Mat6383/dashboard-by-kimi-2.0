import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';

export const PROJECTS_QUERY_KEY = ['projects'];

/**
 * Hook React Query pour récupérer la liste des projets.
 * Cache : 5 min stale, 10 min garbage collection.
 */
export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiService.getProjects();
      return res.data?.result ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
