/* global process, console, window */
// Run after serving .cache/a1 on port 5181. Uses the existing Playwright install.
import { chromium } from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    path.resolve('.cache/browser/chromium'),
  headless: true,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
  env: { ...process.env, LD_LIBRARY_PATH: path.resolve('.cache/browser/lib') },
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [],
    outside = [],
    failed = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.error('BROWSER ERROR:', e.stack);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('BROWSER CONSOLE:', m.text());
  });
  page.on('requestfailed', (r) =>
    failed.push({ url: r.url(), error: r.failure()?.errorText }),
  );
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (
      !url.startsWith('http://127.0.0.1:5181/') &&
      !url.startsWith('data:') &&
      !url.startsWith('blob:')
    ) {
      outside.push(url);
      await route.abort();
    } else await route.continue();
  });
  await page.goto('http://127.0.0.1:5181/study-viewer.html');
  await Promise.race([
    page.waitForFunction(() => window.a1Ready === true, {}, { timeout: 45000 }),
    page.waitForEvent('pageerror', { timeout: 0 }).then((e) => {
      throw e;
    }),
  ]);
  const report = await page.evaluate(() => window.a1Evidence);
  assert.equal(errors.length, 0, JSON.stringify(errors));
  assert.equal(outside.length, 0, JSON.stringify(outside));
  assert.equal(report.imports.length, 3);
  assert.equal(report.animation.changed, true);
  assert.equal(report.cycles.length, 3);
  await page.screenshot({
    path: 'docs/evidence/a1/browser-technical-study.png',
    fullPage: true,
  });
  const disposed = await page.evaluate(() => window.a1Dispose());
  assert.equal(disposed.sceneDisposed, true);
  assert.equal(disposed.engineScenes, 0);
  report.browser = await browser.version();
  report.externalNetworkRequests = outside;
  report.pageErrors = errors;
  report.failedRequests = failed;
  report.fullDisposal = disposed;
  report.scope =
    'Isolated A1 WebGL2/SwiftShader diagnostic, not Windows/physical GPU/WebGPU or final asset/visual acceptance';
  await fs.writeFile(
    'docs/evidence/a1/browser-study.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
