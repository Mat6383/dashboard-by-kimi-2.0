/**
 * ================================================
 * tRPC CLIENT — Frontend
 * ================================================
 */

import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from '~server/trpc/router';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      headers() {
        return {
          'x-request-id': generateRequestId(),
          Authorization: `Bearer ${localStorage.getItem('qa_dashboard_token') || ''}`,
        };
      },
    }),
  ],
});
