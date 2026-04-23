const { test, expect } = require('@playwright/test');

test('GET /api/feature-flags retourne un objet', async ({ request }) => {
  const res = await request.get('http://localhost:3001/api/feature-flags');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(typeof body.data).toBe('object');
});

test('PUT /api/feature-flags/:key met à jour un flag', async ({ request }) => {
  const res = await request.put('http://localhost:3001/api/feature-flags/test-flag', {
    data: { enabled: true },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.data.enabled).toBe(true);

  // Vérifier que le flag persiste
  const getRes = await request.get('http://localhost:3001/api/feature-flags/test-flag');
  expect((await getRes.json()).data.enabled).toBe(true);
});
