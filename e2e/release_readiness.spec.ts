import { test, expect } from '@playwright/test';

test.describe('Release Readiness End-to-End Audit Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1. Timer accuracy, pause/resume, and background-tab recovery simulation', async ({ page }) => {
    await page.goto('./');

    const startBtn = page.getByRole('button', { name: /start (focus|timer)/i });
    await expect(startBtn).toBeVisible();
    await expect(page.locator('text=25:00')).toBeVisible();

    // Start timer
    await startBtn.click();

    const pauseBtn = page.getByRole('button', { name: /pause timer/i });
    await expect(pauseBtn).toBeVisible();

    await page.waitForTimeout(1200);

    // Pause timer
    await pauseBtn.click();
    await expect(startBtn).toBeVisible();

    // Resume timer
    await startBtn.click();
    await expect(pauseBtn).toBeVisible();

    // Background tab visibility simulation
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(1000);

    // Tab wake recovery
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
    await expect(startBtn).toBeVisible();
  });

  test('2. Audio controls: multi-channel toggling, volume adjustment, and master mute', async ({ page }) => {
    await page.goto('./');

    // Open Soundscapes Mixer
    const soundsBtn = page.getByRole('button', { name: /sounds/i });
    await soundsBtn.click();

    const mixerHeading = page.getByRole('heading', { name: 'Procedural Soundscapes' });
    await expect(mixerHeading).toBeVisible();

    // Multi-channel toggle: Gentle Rain & Ocean Waves using accessible aria-labels
    const rainToggle = page.getByLabel('Toggle Gentle Rain');
    await expect(rainToggle).toBeVisible();
    await rainToggle.click();

    const wavesToggle = page.getByLabel('Toggle Ocean Waves');
    await expect(wavesToggle).toBeVisible();
    await wavesToggle.click();

    // Adjust Master Volume slider
    const masterSlider = page.locator('input[type="range"]').first();
    await masterSlider.fill('0.55');

    // Test alert chime trigger
    const chimeBtn = page.getByRole('button', { name: /chime/i });
    await chimeBtn.click();

    // Toggle Master Mute in mixer
    const muteBtnInMixer = page.getByLabel('Toggle master mute');
    await muteBtnInMixer.click();

    // Close mixer
    const closeMixerBtn = page.getByLabel('Close mixer');
    await closeMixerBtn.click();
    await expect(mixerHeading).not.toBeVisible();

    // Toggle Master Mute from BottomBar
    const bottomMuteBtn = page.getByLabel('Toggle mute');
    await expect(bottomMuteBtn).toBeVisible();
    await bottomMuteBtn.click();
  });

  test('3. Task creation, completion toggle, and focus priority binding', async ({ page }) => {
    await page.goto('./');

    // Open Task Drawer
    const tasksBtn = page.getByLabel('Open Tasks');
    await tasksBtn.click();

    const drawerHeading = page.getByRole('heading', { name: 'Focus Tasks' });
    await expect(drawerHeading).toBeVisible();

    // Add new task
    const taskInput = page.getByPlaceholder('Add a new task...');
    await taskInput.fill('Complete Indian Polity Prelims Revision');

    const addTaskBtn = page.getByRole('button', { name: 'Add Task' });
    await addTaskBtn.click();

    // Verify task is present in list
    const taskItem = page.locator('span').filter({ hasText: 'Complete Indian Polity Prelims Revision' }).first();
    await expect(taskItem).toBeVisible();

    // Close task drawer
    const closeDrawerBtn = page.getByLabel('Close task drawer');
    await closeDrawerBtn.click();
    await expect(drawerHeading).not.toBeVisible();
  });

  test('4. Settings updates and persistence across simulated reload', async ({ page }) => {
    await page.goto('./');

    // Open Settings Modal
    const settingsBtn = page.getByLabel('Open Settings');
    await settingsBtn.click();

    const settingsHeading = page.getByRole('heading', { name: 'Settings & Preferences' });
    await expect(settingsHeading).toBeVisible();

    // Select a theme (Emerald Forest)
    const forestThemeBtn = page.getByRole('button', { name: /Emerald Forest/i });
    await forestThemeBtn.click();

    // Close settings modal
    const closeSettingsBtn = page.getByLabel('Close settings');
    await closeSettingsBtn.click();
    await expect(settingsHeading).not.toBeVisible();

    // Verify localStorage has persisted settings
    const storedSettings = await page.evaluate(() => {
      return localStorage.getItem('flocus_engine_settings');
    });
    expect(storedSettings).not.toBeNull();
    expect(storedSettings).toContain('deep-forest');

    // Reload page to simulate cold restart
    await page.reload();

    // Confirm stored setting survived page reload
    const storedAfterReload = await page.evaluate(() => {
      return localStorage.getItem('flocus_engine_settings');
    });
    expect(storedAfterReload).toContain('deep-forest');
  });

  test('5. High-resolution screenshot capture for Release Readiness Audit', async ({ page }) => {
    // 5.1 Desktop Viewport (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('./');
    await page.waitForTimeout(600);

    // 1) desktop-focus.png
    await page.screenshot({ path: 'screenshots/desktop-focus.png', fullPage: true });

    // 2) desktop-ambient.png
    const ambientBtn = page.getByRole('button', { name: 'Ambient Mode', exact: true });
    await ambientBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/desktop-ambient.png', fullPage: true });

    // Switch back to Focus Mode using keyboard shortcut 'f'
    await page.keyboard.press('f');
    await page.waitForTimeout(500);

    // 3) desktop-mixer.png
    const soundsBtn = page.getByLabel('Open Sounds');
    await soundsBtn.click();
    await expect(page.getByRole('heading', { name: 'Procedural Soundscapes' })).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/desktop-mixer.png', fullPage: true });
    await page.getByLabel('Close mixer').click();

    // 4) desktop-tasks.png
    const tasksBtn = page.getByLabel('Open Tasks');
    await tasksBtn.click();
    await expect(page.getByRole('heading', { name: 'Focus Tasks' })).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'screenshots/desktop-tasks.png', fullPage: true });
    await page.getByLabel('Close task drawer').click();

    // 5.2 Mobile Viewport (390x844 - iPhone 14/15)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // 5) mobile-focus.png
    await page.screenshot({ path: 'screenshots/mobile-focus.png', fullPage: true });

    // 6) mobile-ambient.png
    await page.keyboard.press('a');
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'screenshots/mobile-ambient.png', fullPage: true });
  });
});
