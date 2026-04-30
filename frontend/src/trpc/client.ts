/**
 * ================================================
 * tRPC CLIENT — Frontend
 * ================================================
 * Bridge vers le backend Python (FastAPI + tRPC bridge).
 * Le endpoint /trpc est servi par backend_py/app/routers/trpc.py
 */

import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
// TODO: générer un AppRouter côté frontend depuis le bridge Python
// Pour l'instant on conserve le type Node.js (même shape de procédures)
import type { AppRouter } from '~server/trpc/router';

export function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  // En dev local le backend Python écoute aussi sur 3001
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

export function generateRequestId(): string {
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
