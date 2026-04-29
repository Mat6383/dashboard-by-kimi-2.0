const { test, expect } = require('@playwright/test');

test.describe('P24 — Alerting avancé', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/?$/);
    await page.goto('/notifications');
  });

  test('navigation entre les onglets de notifications', async ({ page }) => {
    await expect(page.locator('text=Paramètres')).toBeVisible();
    await page.click('text=Templates');
    await expect(page.locator('text=Template Email')).toBeVisible();
    await page.click('text=Webhooks');
    await expect(page.locator('text=Ajouter')).toBeVisible();
  });
});
