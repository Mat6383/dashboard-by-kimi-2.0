import { trpc } from '../../trpc/client';
import type { Project } from '../../types/api.types';

export const PROJECTS_QUERY_KEY = ['projects'] as const;

/**
 * Hook tRPC pour récupérer la liste des projets.
 * Cache : 5 min stale.
 */
export function useProjects() {
  const { data, ...rest } = trpc.projects.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  return {
    data: (data?.data?.result ?? []) as Project[],
    ...rest,
  };
}
