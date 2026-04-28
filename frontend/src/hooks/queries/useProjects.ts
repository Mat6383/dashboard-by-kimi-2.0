import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api.service';
import type { Project } from '../../types/api.types';
import { unwrapApiResponse } from '../../types/api.types';

export const PROJECTS_QUERY_KEY = ['projects'] as const;

/**
 * Hook React Query pour récupérer la liste des projets.
 * Cache : 5 min stale, 10 min garbage collection.
 */
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiService.getProjects();
      return unwrapApiResponse(res).result ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
