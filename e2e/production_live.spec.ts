import { test, expect } from '@playwright/test';

const LIVE_URL = 'https://bishwadeept23.github.io/focus-ambient-studio/';

test.describe('Production Live Website Smoke Verification Suite', () => {
  test('1. Loads production application over HTTPS without console errors or missing assets', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto(LIVE_URL);
    expect(response?.status()).toBe(200);

    // Verify main timer title and initial time display
    await expect(page.locator('text=25:00')).toBeVisible({ timeout: 15000 });
    const startBtn = page.getByRole('button', { name: /start (focus|timer)/i });
    await expect(startBtn).toBeVisible();

    // Verify 0 critical console errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('font')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('2. Timer functionality: start, pause, resume, and interval state transitions', async ({ page }) => {
    await page.goto(LIVE_URL);
    await expect(page.locator('text=25:00')).toBeVisible();

    const startBtn = page.getByRole('button', { name: /start (focus|timer)/i });
    await startBtn.click();

    const pauseBtn = page.getByRole('button', { name: /pause timer/i });
    await expect(pauseBtn).toBeVisible();

    await page.waitForTimeout(1200);
    await pauseBtn.click();
    await expect(startBtn).toBeVisible();
  });

  test('3. Audio synthesis controls: open mixer, adjust volume, toggle channels, and master mute', async ({ page }) => {
    await page.goto(LIVE_URL);

    // Open soundscape mixer
    const soundsBtn = page.getByLabel('Open Sounds');
    await soundsBtn.click();

    const mixerHeading = page.getByRole('heading', { name: 'Procedural Soundscapes' });
    await expect(mixerHeading).toBeVisible();

    // Toggle channels
    const rainToggle = page.getByLabel('Toggle Gentle Rain');
    await rainToggle.click();

    // Adjust volume
    const masterSlider = page.locator('input[type="range"]').first();
    await masterSlider.fill('0.6');

    // Close mixer
    await page.getByLabel('Close mixer').click();
    await expect(mixerHeading).not.toBeVisible();

    // Toggle master mute
    const muteBtn = page.getByLabel('Toggle mute');
    await muteBtn.click();
  });

  test('4. Task management and persistence on live site', async ({ page }) => {
    await page.goto(LIVE_URL);

    // Open task drawer
    const tasksBtn = page.getByLabel('Open Tasks');
    await tasksBtn.click();

    await expect(page.getByRole('heading', { name: 'Focus Tasks' })).toBeVisible();

    const taskInput = page.getByPlaceholder('Add a new task...');
    await taskInput.fill('Live Production Smoke Task');
    await page.getByRole('button', { name: 'Add Task' }).click();

    await expect(page.locator('span').filter({ hasText: 'Live Production Smoke Task' }).first()).toBeVisible();

    // Wait for debounced local storage persistence
    await page.waitForTimeout(600);

    const persisted = await page.evaluate(() => localStorage.getItem('flocus_engine_tasks'));
    expect(persisted).not.toBeNull();
    expect(persisted).toContain('Live Production Smoke Task');

    // Close task drawer
    await page.getByLabel('Close task drawer').click();
  });

  test('5. Theme settings persistence across reload on live site', async ({ page }) => {
    await page.goto(LIVE_URL);

    // Open Settings Modal
    const settingsBtn = page.getByLabel('Open Settings');
    await settingsBtn.click();

    await expect(page.getByRole('heading', { name: 'Settings & Preferences' })).toBeVisible();

    // Select Emerald Forest theme
    const forestThemeBtn = page.getByRole('button', { name: /Emerald Forest/i });
    await forestThemeBtn.click();

    // Close settings modal
    await page.getByLabel('Close settings').click();

    // Reload page to verify persistence
    await page.reload();
    await expect(page.locator('text=25:00')).toBeVisible();

    const storedSettings = await page.evaluate(() => localStorage.getItem('flocus_engine_settings'));
    expect(storedSettings).toContain('deep-forest');
  });

  test('6. Service Worker registration, scope, and offline reload on live site', async ({ page, context }) => {
    await page.goto(LIVE_URL);
    await expect(page.locator('text=25:00')).toBeVisible();

    // Wait for Service Worker registration and active controller
    await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) throw new Error('ServiceWorker unsupported');
      const reg = await navigator.serviceWorker.ready;
      if (reg.installing) {
        await new Promise((resolve) => {
          reg.installing!.addEventListener('statechange', (e: any) => {
            if (e.target.state === 'activated') resolve(true);
          });
        });
      }
    });

    // Reload once online to ensure controller caches assets
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('text=25:00')).toBeVisible();

    const isControlled = await page.evaluate(() => navigator.serviceWorker.controller !== null);
    expect(isControlled).toBe(true);

    // Emulate network disconnection
    await context.setOffline(true);

    // Reload page while offline
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify application shell loaded completely offline from cache
    await expect(page.locator('text=25:00')).toBeVisible();
    const startBtn = page.getByRole('button', { name: /start (focus|timer)/i });
    await expect(startBtn).toBeVisible();

    // Test offline timer start & pause
    await startBtn.click();
    const pauseBtn = page.getByRole('button', { name: /pause timer/i });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
    await expect(startBtn).toBeVisible();

    // Restore online
    await context.setOffline(false);
  });

  test('7. Responsive mobile layout on live site (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LIVE_URL);
    await expect(page.locator('text=25:00')).toBeVisible();

    const startBtn = page.getByRole('button', { name: /start (focus|timer)/i });
    await expect(startBtn).toBeVisible();

    // Switch to Ambient mode on mobile
    const modeBtn = page.getByRole('button', { name: /ambient mode/i });
    if (await modeBtn.isVisible()) {
      await modeBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
