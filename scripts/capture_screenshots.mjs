import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

async function capture() {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Starting Vite preview server on port 4173...');
  const server = spawn('npm.cmd', ['run', 'preview', '--', '--port', '4173'], {
    shell: true,
    stdio: 'ignore',
  });

  try {
    await waitForServer('http://localhost:4173/focus-ambient-studio/');
    console.log('Preview server ready! Launching Chromium...');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Desktop Viewport (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:4173/focus-ambient-studio/');
    await page.waitForTimeout(1000);

    console.log('Capturing desktop-focus.png...');
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-focus.png'), fullPage: true });

    // 2. desktop-ambient.png
    console.log('Capturing desktop-ambient.png...');
    const ambientBtn = page.getByTitle(/Switch to Ambient/i);
    await ambientBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-ambient.png'), fullPage: true });

    // 3. desktop-mixer.png
    console.log('Capturing desktop-mixer.png...');
    const soundsBtn = page.getByTitle('Open Soundscapes Mixer');
    await soundsBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-mixer.png'), fullPage: true });
    const closeMixer = page.getByLabel('Close mixer');
    await closeMixer.click();
    await page.waitForTimeout(400);

    // 4. desktop-tasks.png
    console.log('Capturing desktop-tasks.png...');
    const tasksBtn = page.getByTitle('Open Task Manager (T)');
    await tasksBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, 'desktop-tasks.png'), fullPage: true });
    const closeTasks = page.getByLabel('Close task drawer');
    await closeTasks.click();
    await page.waitForTimeout(400);

    // 5. Mobile Viewport (390x844 - iPhone 14/15)
    console.log('Setting mobile viewport (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // Switch back to Focus Mode
    const focusBtn = page.getByTitle(/Switch to Focus/i);
    if (await focusBtn.isVisible()) {
      await focusBtn.click();
      await page.waitForTimeout(600);
    }

    console.log('Capturing mobile-focus.png...');
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-focus.png'), fullPage: true });

    console.log('Capturing mobile-ambient.png...');
    const mobileAmbientBtn = page.getByTitle(/Switch to Ambient/i);
    if (await mobileAmbientBtn.isVisible()) {
      await mobileAmbientBtn.click();
      await page.waitForTimeout(600);
    }
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-ambient.png'), fullPage: true });

    await browser.close();
    console.log('All 6 screenshots captured successfully in screenshots/!');
  } finally {
    server.kill();
  }
}

capture().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
