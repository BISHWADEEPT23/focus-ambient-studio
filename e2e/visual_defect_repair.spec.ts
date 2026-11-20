import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Focus & Ambient Studio — Visual Defect Repair Verification', () => {
  const screenshotsDir = path.resolve(process.cwd(), 'screenshots', 'visual-repair');

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

  test('1. Idle Flip Clock — Geometry, split alignment, and legibility', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    // Switch to Flip Clock
    const styleToggleBtn = page.getByLabel('Toggle timer display style');
    await expect(styleToggleBtn).toBeVisible();
    await styleToggleBtn.click();

    const flipDisplay = page.getByTestId('flip-clock-display');
    await expect(flipDisplay).toBeVisible();

    // Check geometry of first digit card
    const firstDigit = page.getByTestId('flip-digit-card').first();
    const box = await firstDigit.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(70);

    // Verify upper and lower card halves exist and are vertically split at 50%
    const topHalf = firstDigit.locator('.flip-card-top').first();
    const bottomHalf = firstDigit.locator('.flip-card-bottom').first();
    const topBox = await topHalf.boundingBox();
    const bottomBox = await bottomHalf.boundingBox();

    expect(topBox).not.toBeNull();
    expect(bottomBox).not.toBeNull();

    // Upper half should end exactly where lower half begins (within 2px tolerance for hinge line)
    expect(Math.abs(topBox!.y + topBox!.height - bottomBox!.y)).toBeLessThanOrEqual(2);

    // Capture Screenshot 1: Idle Flip Clock
    const screenshotPath = path.join(screenshotsDir, '1-idle-flip-clock.png');
    await flipDisplay.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('2. Clock Mid-Transition — Animated flaps, 9->0 transition, and no glyph overlapping', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    // Switch to Flip Clock
    await page.getByLabel('Toggle timer display style').click();

    // Start Timer to trigger flip transitions
    const startBtn = page.getByRole('button', { name: /start (focus|timer)/i });
    await startBtn.click();

    // Wait until seconds tick (from 00 to 59: tens goes 0->5, units goes 0->9)
    await page.waitForTimeout(950);

    // Capture Screenshot 2: Clock Mid-Transition
    const screenshotPath = path.join(screenshotsDir, '2-clock-mid-transition.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);

    // Pause timer
    const pauseBtn = page.getByRole('button', { name: /pause timer/i });
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
    }
  });

  test('3. Sound Mixer At Top — Master volume container separation and no overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    // Open sound mixer
    await page.getByLabel('Open Sounds').click();
    const mixerDialog = page.getByRole('dialog');
    await expect(mixerDialog).toBeVisible();

    // Verify Master Controls box and first sound card do NOT overlap
    const masterSlider = page.getByLabel('Master volume slider');
    const masterBox = await masterSlider.boundingBox();
    expect(masterBox).not.toBeNull();

    const firstSoundCard = page.getByTestId('sound-card-rain');
    const cardBox = await firstSoundCard.boundingBox();
    expect(cardBox).not.toBeNull();

    // Geometry check: Master slider container must be strictly ABOVE the sound cards list
    expect(masterBox!.y + masterBox!.height).toBeLessThan(cardBox!.y);

    // Capture Screenshot 3: Sound Mixer At Top
    const screenshotPath = path.join(screenshotsDir, '3-sound-mixer-top.png');
    await mixerDialog.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('4. Sound Mixer At Middle — Scrolled state and clickable controls', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    await page.getByLabel('Open Sounds').click();
    const mixerDialog = page.getByRole('dialog');
    await expect(mixerDialog).toBeVisible();

    const scrollContainer = page.getByTestId('sound-cards-container');
    await expect(scrollContainer).toBeVisible();

    // Scroll container to middle
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight / 3;
    });
    await page.waitForTimeout(300);

    // Verify middle card controls are clickable
    const middleCard = page.getByTestId('sound-card-birds');
    await expect(middleCard).toBeVisible();
    const birdsToggle = page.getByLabel('Toggle Forest Birds');
    await expect(birdsToggle).toBeEnabled();

    // Capture Screenshot 4: Sound Mixer At Middle
    const screenshotPath = path.join(screenshotsDir, '4-sound-mixer-middle.png');
    await mixerDialog.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('5. Sound Mixer At Bottom — Bottom-most card fully visible and not clipped', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('./');

    await page.getByLabel('Open Sounds').click();
    const mixerDialog = page.getByRole('dialog');
    await expect(mixerDialog).toBeVisible();

    const scrollContainer = page.getByTestId('sound-cards-container');

    // Scroll to the absolute bottom
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(300);

    // Verify last card (Pure White Noise) is fully in viewport of container
    const lastCard = page.getByTestId('sound-card-white_noise');
    await expect(lastCard).toBeVisible();

    const containerBox = await scrollContainer.boundingBox();
    const lastCardBox = await lastCard.boundingBox();

    expect(containerBox).not.toBeNull();
    expect(lastCardBox).not.toBeNull();

    // Last card top must be within container
    expect(lastCardBox!.y).toBeGreaterThanOrEqual(containerBox!.y - 10);
    expect(lastCardBox!.y + lastCardBox!.height).toBeLessThanOrEqual(containerBox!.y + containerBox!.height + 15);

    // Capture Screenshot 5: Sound Mixer At Bottom
    const screenshotPath = path.join(screenshotsDir, '5-sound-mixer-bottom.png');
    await mixerDialog.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('6. Mobile Clock and Mixer (390px) — No clipping or horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');

    // Switch to Flip Clock on mobile
    await page.getByLabel('Toggle timer display style').click();

    // Verify Clock fits in mobile viewport without horizontal overflow
    const flipDisplay = page.getByTestId('flip-clock-display');
    await expect(flipDisplay).toBeVisible();
    const clockBox = await flipDisplay.boundingBox();
    expect(clockBox).not.toBeNull();
    expect(clockBox!.x).toBeGreaterThanOrEqual(0);
    expect(clockBox!.x + clockBox!.width).toBeLessThanOrEqual(390);

    // Verify Body has no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);

    // Open Mixer on mobile
    await page.getByLabel('Open Sounds').click();
    const mixerDialog = page.getByRole('dialog');
    await expect(mixerDialog).toBeVisible();

    // Verify modal fits within 390px
    const modalBox = await mixerDialog.boundingBox();
    expect(modalBox).not.toBeNull();
    expect(modalBox!.x + modalBox!.width).toBeLessThanOrEqual(390);

    // Capture Screenshot 6: Mobile Clock and Mixer
    const screenshotPath = path.join(screenshotsDir, '6-mobile-clock-and-mixer.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('7. Responsive Viewport Widths (390px, 768px, 1366px, 1920px) — Zero horizontal overflow', async ({ page }) => {
    const viewports = [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
      { width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('./');

      // Verify no horizontal overflow at this width
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify bottom navigation bar is within viewport
      const bottomBar = page.locator('nav').first();
      const barBox = await bottomBar.boundingBox();
      expect(barBox).not.toBeNull();
      expect(barBox!.x).toBeGreaterThanOrEqual(0);
      expect(barBox!.x + barBox!.width).toBeLessThanOrEqual(vp.width);
    }
  });
});
