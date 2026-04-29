const { test, expect } = require('@playwright/test');

test.describe('UX Improvements', () => {
  test('compact mode toggle persists after reload', async ({ page }) => {
    await page.goto('/');
    // Wait for React to mount
    await page.waitForSelector('body');

    // Pre-enable compact mode via localStorage and reload
    await page.evaluate(() => {
      localStorage.setItem('testmo_compactMode', 'true');
    });
    await page.reload();
    await page.waitForSelector('body');

    // Verify compact class is on body
    const hasCompact = await page.evaluate(() => document.body.classList.contains('compact-mode'));
    expect(hasCompact).toBe(true);

    // Disable and reload
    await page.evaluate(() => {
      localStorage.setItem('testmo_compactMode', 'false');
    });
    await page.reload();
    await page.waitForSelector('body');

    const hasCompactAfter = await page.evaluate(() => document.body.classList.contains('compact-mode'));
    expect(hasCompactAfter).toBe(false);
  });

  test('keyboard help overlay opens and closes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body');

    // Press ? to open help
    await page.keyboard.press('?');
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('text=Raccourcis clavier')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });
});
