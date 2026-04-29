/**
 * ================================================
 * tRPC TEST SETUP
 * ================================================
 */

import { createCallerFactory } from '../../trpc/init';
import { appRouter } from '../../trpc/router';

export function createTestCaller() {
  return createCallerFactory(appRouter)({
    user: null,
    requestId: 'test-request',
    req: {} as any,
    res: {} as any,
  });
}

export function createAuthedCaller(user: any = { id: 1, role: 'admin' }) {
  return createCallerFactory(appRouter)({
    user,
    requestId: 'test-request',
    req: {} as any,
    res: {} as any,
  });
}
