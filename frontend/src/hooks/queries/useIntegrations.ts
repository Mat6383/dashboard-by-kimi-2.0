import { trpc } from '../../trpc/client';

export interface Integration {
  id: number;
  name: string;
  type: 'jira' | 'azure_devops' | 'generic_webhook';
  config: Record<string, unknown>;
  enabled: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useIntegrations() {
  return trpc.integrations.list.useQuery(undefined, { staleTime: 60 * 1000 });
}
