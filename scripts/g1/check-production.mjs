/* global console, process, window */
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const software = process.env.PLAYWRIGHT_SOFTWARE_RENDERING === '1';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: software
    ? [
        '--no-sandbox',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ]
    : [],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [],
    failed = [],
    httpErrors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => failed.push(r.url()));
  page.on('response', (r) => {
    if (r.status() >= 400)
      httpErrors.push({ url: r.url(), status: r.status() });
  });
  const url = process.env.G1_URL || 'http://localhost:4173/?renderer=webgl2';
  await page.goto(url);
  await expect(page.getByTestId('active-backend')).toHaveText('WebGL2', {
    timeout: 120_000,
  });
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.screenshot({ path: 'docs/evidence/g1/production-playable.png' });
  const telemetryPresent = await page.evaluate(() => !!window.__CODEVERSE__);
  const report = {
    url,
    browser: await browser.version(),
    environment: software
      ? 'SwiftShader software WebGL2, not laptop/GPU/FPS proof'
      : 'Browser default GPU configuration; no performance claim',
    backend: await page.getByTestId('active-backend').textContent(),
    telemetryPresent,
    errors,
    failed,
    httpErrors,
  };
  await fs.writeFile(
    'docs/evidence/g1/browser-production.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  expect(telemetryPresent).toBe(false);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
  expect(httpErrors).toEqual([]);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
