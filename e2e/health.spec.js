const { test, expect } = require('@playwright/test');

test('API health retourne OK', async ({ request }) => {
  const res = await request.get('http://localhost:3001/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('OK');
});

test('API health/db retourne les checks SQLite', async ({ request }) => {
  const res = await request.get('http://localhost:3001/api/health/db');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.checks).toHaveProperty('syncHistory');
  expect(body.checks).toHaveProperty('comments');
});
