const { test, expect } = require('@playwright/test');

test('GET /api/feature-flags retourne un objet', async ({ request }) => {
  const res = await request.get('http://localhost:3001/api/feature-flags', {
    headers: { 'X-Admin-Token': 'test-e2e-admin-token' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(typeof body.data).toBe('object');
});

test('PUT /api/feature-flags/:key met à jour un flag', async ({ request }) => {
  const headers = { 'X-Admin-Token': 'test-e2e-admin-token' };
  const res = await request.put('http://localhost:3001/api/feature-flags/test-flag', {
    headers,
    data: { enabled: true },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.data.enabled).toBe(true);

  // Vérifier que le flag persiste
  const getRes = await request.get('http://localhost:3001/api/feature-flags/test-flag', { headers });
  expect((await getRes.json()).data.enabled).toBe(true);
});
