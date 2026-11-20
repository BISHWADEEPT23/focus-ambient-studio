import { test, expect } from '@playwright/test';

test.describe('Offline-First & PWA Installation Verification Suite', () => {
  test('1. Validates Web App Manifest schema and installation criteria', async ({ page }) => {
    const response = await page.goto('./manifest.json');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe('Focus & Ambient Studio');
    expect(manifest.short_name).toBe('Flocus');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url === '/' || manifest.start_url === './').toBe(true);
    expect(manifest.background_color).toBe('#0a0a0a');
    expect(manifest.theme_color).toBe('#0a0a0a');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.icons.some((i: any) => i.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((i: any) => i.sizes === '512x512')).toBe(true);
  });

  test('2. Service Worker registration, activation, offline caching, and reload', async ({ page, context }) => {
    // 1. Load application online
    await page.goto('./');
    await expect(page.locator('text=25:00')).toBeVisible();

    // 2. Wait for Service Worker registration and activation
    await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      if (reg.installing) {
        await new Promise((resolve) => {
          reg.installing!.addEventListener('statechange', (e: any) => {
            if (e.target.state === 'activated') resolve(true);
          });
        });
      }
    });

    // Reload once while online so controller claims and caches runtime assets
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('text=25:00')).toBeVisible();

    // Confirm Service Worker controller is active
    const isControlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
    expect(isControlled).toBe(true);

    // 3. Emulate complete network disconnection
    await context.setOffline(true);

    // 4. Reload page while offline
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 5. Verify application shell loads completely from offline cache
    await expect(page.locator('text=25:00')).toBeVisible();
    const startBtn = page.getByRole('button', { name: /start (focus|timer)/i });
    await expect(startBtn).toBeVisible();

    // 6. Test timer operations completely offline
    await startBtn.click();
    const pauseBtn = page.getByRole('button', { name: /pause timer/i });
    await expect(pauseBtn).toBeVisible();
    await page.waitForTimeout(1100);
    await pauseBtn.click();
    await expect(startBtn).toBeVisible();

    // 7. Test local persistence while offline (Task creation & LocalStorage)
    const tasksBtn = page.getByLabel('Open Tasks');
    await tasksBtn.click();
    await expect(page.getByRole('heading', { name: 'Focus Tasks' })).toBeVisible();

    const taskInput = page.getByPlaceholder('Add a new task...');
    await taskInput.fill('Offline Verified Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    await expect(page.locator('span').filter({ hasText: 'Offline Verified Task' }).first()).toBeVisible();

    // Wait for debounced local storage persistence (400ms debounce in StorageEngine)
    await page.waitForTimeout(600);

    // Check localStorage persistence while offline
    const persisted = await page.evaluate(() => localStorage.getItem('flocus_engine_tasks'));
    expect(persisted).not.toBeNull();
    expect(persisted).toContain('Offline Verified Task');

    // 8. Restore online status
    await context.setOffline(false);
  });
});
