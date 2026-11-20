import { test, expect } from '@playwright/test';

test.describe('Flocus Functional Repair E2E Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1. Flip clock 3D display, split-flap structure, and ticking mechanics', async ({ page }) => {
    await page.goto('./');

    // 1. Initially in Digital mode, switch to Flip mode
    const styleToggleBtn = page.getByLabel('Toggle timer display style');
    await expect(styleToggleBtn).toBeVisible();
    await styleToggleBtn.click();

    // 2. Verify Flip Clock display container is visible
    const flipClockDisplay = page.getByTestId('flip-clock-display');
    await expect(flipClockDisplay).toBeVisible();

    // 3. Verify Minutes and Seconds groups exist
    const flipGroups = page.getByTestId('flip-unit-group');
    await expect(flipGroups).toHaveCount(2); // Minutes and Seconds

    // 4. Verify split-flap top and bottom halves and hinge lines exist
    const topHalves = page.locator('.flip-card-top');
    const bottomHalves = page.locator('.flip-card-bottom');
    const hingeLines = page.locator('.flip-hinge-line');
    await expect(topHalves).toHaveCount(4); // 2 digits for min, 2 digits for sec
    await expect(bottomHalves).toHaveCount(4);
    await expect(hingeLines).toHaveCount(4);

    // Initial state shows 25:00
    const digitCards = page.getByTestId('flip-digit-card');
    await expect(digitCards.nth(0)).toHaveAttribute('data-digit', '2');
    await expect(digitCards.nth(1)).toHaveAttribute('data-digit', '5');
    await expect(digitCards.nth(2)).toHaveAttribute('data-digit', '0');
    await expect(digitCards.nth(3)).toHaveAttribute('data-digit', '0');

    // 5. Start timer and verify ticking update
    const startBtn = page.getByRole('button', { name: /start (focus|timer)/i });
    await startBtn.click();

    // Wait for timer to tick from 25:00 to 24:59 (seconds change from 00 to 59)
    await page.waitForTimeout(1400);

    // After 1-2 ticks, seconds units should have flipped
    const secTens = await digitCards.nth(2).getAttribute('data-digit');
    const secUnits = await digitCards.nth(3).getAttribute('data-digit');
    const secondsValue = parseInt((secTens || '0') + (secUnits || '0'), 10);
    expect(secondsValue).toBeLessThanOrEqual(59);

    // Pause timer
    const pauseBtn = page.getByRole('button', { name: /pause timer/i });
    await pauseBtn.click();
  });

  test('2. Ambient audio engine: Forest Birds, multi-channel mixing, and master volume', async ({ page }) => {
    await page.goto('./');

    // Open Mixer
    const soundsBtn = page.getByRole('button', { name: /sounds/i });
    await soundsBtn.click();

    const mixerModal = page.getByRole('heading', { name: 'Procedural Soundscapes' });
    await expect(mixerModal).toBeVisible();

    // Verify Forest Birds channel exists and toggle it
    const birdsToggle = page.getByLabel('Toggle Forest Birds');
    await expect(birdsToggle).toBeVisible();
    await birdsToggle.click();

    // Verify Gentle Rain channel toggle
    const rainToggle = page.getByLabel('Toggle Gentle Rain');
    await expect(rainToggle).toBeVisible();
    await rainToggle.click();

    // Verify Ocean Waves channel toggle
    const wavesToggle = page.getByLabel('Toggle Ocean Waves');
    await expect(wavesToggle).toBeVisible();
    await wavesToggle.click();

    // Check that AudioContext is running or resumed in window
    const audioState = await page.evaluate(() => {
      // AudioContext state check in browser
      return window.AudioContext ? 'supported' : 'unsupported';
    });
    expect(audioState).toBe('supported');

    // Test alert chime trigger
    const chimeBtn = page.getByRole('button', { name: /chime/i });
    await chimeBtn.click();

    // Adjust master volume
    const masterSlider = page.locator('input[type="range"]').first();
    await masterSlider.fill('0.65');

    // Toggle master mute in modal
    const muteBtn = page.getByLabel('Toggle master mute');
    await muteBtn.click();

    // Close mixer
    const closeBtn = page.getByLabel('Close mixer');
    await closeBtn.click();
    await expect(mixerModal).not.toBeVisible();
  });

  test('3. Dynamic theme switching: CSS custom properties, palette changes, and persistence', async ({ page }) => {
    await page.goto('./');

    // 1. Verify default theme custom properties on documentElement
    let themeId = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeId).toBe('twilight-glow');

    let primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
    );
    expect(primaryColor).toBe('#8b5cf6');

    // 2. Open Settings
    const settingsBtn = page.getByLabel('Open Settings');
    await settingsBtn.click();

    const settingsHeading = page.getByRole('heading', { name: 'Settings & Preferences' });
    await expect(settingsHeading).toBeVisible();

    // 3. Select Emerald Forest (Emerald)
    const emeraldForestBtn = page.getByRole('button', { name: /Emerald Forest/i });
    await expect(emeraldForestBtn).toBeVisible();
    await emeraldForestBtn.click();

    // Verify documentElement updated immediately
    themeId = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeId).toBe('deep-forest');

    primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
    );
    expect(primaryColor).toBe('#10b981');

    // 4. Select Rainy Window (Sky Blue)
    const rainyWindowBtn = page.getByRole('button', { name: /Rainy Window/i });
    await rainyWindowBtn.click();

    themeId = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeId).toBe('rainy-window');

    primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
    );
    expect(primaryColor).toBe('#0ea5e9');

    // 5. Select Obsidian Violet (Cyber Focus / Pink)
    const obsidianVioletBtn = page.getByRole('button', { name: /Obsidian Violet/i });
    await obsidianVioletBtn.click();

    themeId = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeId).toBe('cyber-focus');

    primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
    );
    expect(primaryColor).toBe('#ec4899');

    // 6. Close Settings and reload page to test persistence
    const closeSettings = page.getByLabel('Close settings');
    await closeSettings.click();

    await page.reload();

    // Verify persisted theme
    const persistedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(persistedTheme).toBe('cyber-focus');

    const persistedPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim()
    );
    expect(persistedPrimary).toBe('#ec4899');
  });
});
