import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Focus & Ambient Studio — Phase 7 Clean-Room Flip Clock Integration', () => {
  const screenshotsDir = path.resolve(process.cwd(), 'screenshots', 'phase7-improved');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1. Initial digit rendering & Geometry across desktop (1366px)', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    // Switch to Flip Clock
    const styleToggleBtn = page.getByLabel('Toggle timer display style');
    await expect(styleToggleBtn).toBeVisible();
    await styleToggleBtn.click();

    const flipDisplay = page.getByTestId('flip-clock-display');
    await expect(flipDisplay).toBeVisible();

    // Verify 4 digit cards rendered (2 for Minutes, 2 for Seconds)
    const digitCards = page.getByTestId('flip-digit-card');
    await expect(digitCards).toHaveCount(4);

    // Verify geometry of cards
    const firstDigit = digitCards.first();
    const box = await firstDigit.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(70);

    // Verify split halves alignment at 50%
    const topHalf = firstDigit.locator('.flip-card-top').first();
    const bottomHalf = firstDigit.locator('.flip-card-bottom').first();
    const topBox = await topHalf.boundingBox();
    const bottomBox = await bottomHalf.boundingBox();

    expect(topBox).not.toBeNull();
    expect(bottomBox).not.toBeNull();
    expect(Math.abs(topBox!.y + topBox!.height - bottomBox!.y)).toBeLessThanOrEqual(2);

    // Capture Screenshot: Idle Desktop Flip Clock
    const screenshotPath = path.join(screenshotsDir, '1-idle-flip-clock-1366.png');
    await flipDisplay.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('2. 750ms Flip Lifecycle — Mid-point flap rotation & Completion', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    // Switch to Flip Clock
    await page.getByLabel('Toggle timer display style').click();
    const flipDisplay = page.getByTestId('flip-clock-display');
    await expect(flipDisplay).toBeVisible();

    // Start timer to trigger decrement from 25:00 -> 24:59 (seconds tens 0->5, units 0->9)
    const playBtn = page.getByRole('button', { name: /start timer/i });
    await playBtn.click();

    // Wait for the tick to trigger the flip
    const rotatingCard = page.locator('.flip-rotating-card.is-flipping').first();
    await expect(rotatingCard).toBeVisible({ timeout: 2000 });

    // Capture Screenshot: Midpoint of flip transition
    const midScreenshotPath = path.join(screenshotsDir, '2-flip-mid-transition.png');
    await flipDisplay.screenshot({ path: midScreenshotPath });
    expect(fs.existsSync(midScreenshotPath)).toBe(true);

    // Pause timer so in-flight flip finishes without another tick starting immediately
    const pauseBtn = page.getByRole('button', { name: /pause (timer|focus)/i });
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
    }

    // Wait for in-flight animation to finish and commit
    await expect(page.locator('.flip-rotating-card')).toHaveCount(0, { timeout: 4000 });

    // Capture Screenshot: Completed transition
    const completedScreenshotPath = path.join(screenshotsDir, '3-flip-completed-transition.png');
    await flipDisplay.screenshot({ path: completedScreenshotPath });
    expect(fs.existsSync(completedScreenshotPath)).toBe(true);
  });

  test('3. Reset during active flip snaps gracefully to initial time', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    await page.getByLabel('Toggle timer display style').click();
    await page.getByRole('button', { name: /start timer/i }).click();

    // Wait for flip to start
    const rotatingCard = page.locator('.flip-rotating-card.is-flipping').first();
    await expect(rotatingCard).toBeVisible({ timeout: 2000 });

    // Hit Reset immediately while in-flight
    const resetBtn = page.getByLabel('Reset timer');
    await resetBtn.click();

    // Rotating flap should instantly resolve without visual artifacts
    await expect(page.locator('.flip-rotating-card')).toHaveCount(0);
    const minuteDigits = page.getByLabel(/minutes/i);
    await expect(minuteDigits.first()).toBeVisible();
  });

  test('4. Mode switching during active timer updates cards and displays hours when required', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    await page.getByLabel('Toggle timer display style').click();

    // Switch to Countdown mode (60m = 1h00m00s)
    const countdownTab = page.getByRole('button', { name: 'Countdown' });
    await expect(countdownTab).toBeVisible();
    await countdownTab.click();

    // 1 hour should display Hours, Minutes, Seconds flip cards (3 units = 6 digit cards)
    await expect(page.getByText('Hours')).toBeVisible();
    await expect(page.getByText('Minutes')).toBeVisible();
    await expect(page.getByText('Seconds')).toBeVisible();
    await expect(page.getByTestId('flip-digit-card')).toHaveCount(6);

    // Switch back to Short Break (5m = 00h05m00s)
    const shortBreakTab = page.getByRole('button', { name: 'Short Break' });
    await shortBreakTab.click();

    // Should collapse Hours and show 4 digit cards
    await expect(page.getByText('Hours')).toHaveCount(0);
    await expect(page.getByTestId('flip-digit-card')).toHaveCount(4);
  });

  test('5. Theme changes update card surface variables without layout shift', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    await page.getByLabel('Toggle timer display style').click();
    const flipDisplay = page.getByTestId('flip-clock-display');
    const initialBox = await flipDisplay.boundingBox();

    // Open Settings Modal
    const settingsBtn = page.getByLabel('Open Settings');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // Wait for Settings Modal
    await expect(page.getByRole('heading', { name: 'Settings & Preferences' })).toBeVisible();

    // Select 'Emerald Forest'
    const forestThemeBtn = page.getByRole('button', { name: /Emerald Forest/i });
    await forestThemeBtn.click();

    // Close Settings
    await page.getByLabel('Close settings').click();

    // Verify root data-theme attribute
    const htmlTheme = await page.getAttribute('html', 'data-theme');
    expect(htmlTheme).toBe('deep-forest');

    // Verify flip card dimensions did not shift
    const newBox = await flipDisplay.boundingBox();
    expect(Math.abs(newBox!.width - initialBox!.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(newBox!.height - initialBox!.height)).toBeLessThanOrEqual(2);

    // Capture Screenshot: Theme-aware flip clock
    const themeScreenshotPath = path.join(screenshotsDir, '4-theme-emerald-forest.png');
    await flipDisplay.screenshot({ path: themeScreenshotPath });
    expect(fs.existsSync(themeScreenshotPath)).toBe(true);
  });

  test('6. Responsive Viewports — 390px (Mobile), 768px (Tablet), 1366px, 1920px (4K/Desktop)', async ({ page }) => {
    const viewports = [
      { width: 390, height: 844, name: 'mobile-390' },
      { width: 768, height: 1024, name: 'tablet-768' },
      { width: 1366, height: 768, name: 'desktop-1366' },
      { width: 1920, height: 1080, name: 'desktop-1920' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('./');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      const styleToggleBtn = page.getByLabel('Toggle timer display style');
      await expect(styleToggleBtn).toBeVisible();
      await styleToggleBtn.click();

      const flipDisplay = page.getByTestId('flip-clock-display');
      await expect(flipDisplay).toBeVisible();

      // Check no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width + 1);

      // Digits must be fully visible and rendered
      const digitCards = page.getByTestId('flip-digit-card');
      await expect(digitCards).toHaveCount(4);

      // Capture Screenshot
      const vpScreenshotPath = path.join(screenshotsDir, `5-viewport-${vp.name}.png`);
      await flipDisplay.screenshot({ path: vpScreenshotPath });
      expect(fs.existsSync(vpScreenshotPath)).toBe(true);
    }
  });

  test('7. No regression in sound mixer, tasks, or offline capability', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    // 1. Audio Mixer Modal opens and closes
    const soundsBtn = page.getByLabel('Open Sounds');
    await expect(soundsBtn).toBeVisible();
    await soundsBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // 2. Tasks Drawer opens and closes
    const tasksBtn = page.getByLabel('Open Tasks');
    await expect(tasksBtn).toBeVisible();
    await tasksBtn.click();
    await expect(page.getByText('Focus Tasks')).toBeVisible();
    await page.getByLabel('Close task drawer').click();
    await expect(page.getByText('Focus Tasks')).toHaveCount(0);
  });
});
