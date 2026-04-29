import { describe, it, expect } from '@jest/globals';
import { createTestCaller } from './setup';

describe('tRPC anomalies router', () => {
  it('returns circuit breakers', async () => {
    const caller = createTestCaller();
    const result = await caller.anomalies.circuitBreakers();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(3);
  });
});
