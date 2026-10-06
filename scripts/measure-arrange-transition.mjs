import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${process.env.EDITOR_ORIGIN ?? 'http://127.0.0.1:4186'}/construct`, { waitUntil: 'networkidle' });
  await page.locator('.editor-header').waitFor();
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.transitions = [];
    document.addEventListener('click', event => {
      if (event.target.closest('button')?.textContent.trim() !== 'Arrange') return;
      const sample = { feedbackMs: null, maxFrameMs: 0 };
      window.transitions.push(sample);
      const start = performance.now();
      let last = start;
      const frame = now => {
        sample.maxFrameMs = Math.max(sample.maxFrameMs, now - last);
        last = now;
        if (now - start < 1500) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      requestAnimationFrame(() => requestAnimationFrame(() => { sample.feedbackMs = performance.now() - start; }));
    }, true);
  });
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: i % 2 ? 'Connect' : 'Construct', exact: true }).click();
    await page.getByLabel('Home editor canvas', { exact: true }).waitFor({ state: i % 2 ? 'hidden' : 'visible' });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Arrange', exact: true }).click();
    await page.waitForTimeout(2000);
    assert.equal(await page.getByLabel('Home editor canvas', { exact: true }).isVisible(), true);
  }
  await page.screenshot({ path: '/tmp/cabane-arrange-transition.png' });
  console.log(JSON.stringify({ browser: browser.version(), samples: await page.evaluate(() => window.transitions), errors }, null, 2));
  if (errors.length) process.exitCode = 1;
} finally { await browser.close(); }
