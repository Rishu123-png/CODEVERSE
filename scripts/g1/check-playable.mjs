/* global process, console, window */
import { chromium } from '../../node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const browser = await chromium.launch({
  executablePath: path.resolve('.cache/browser/chromium'),
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
    failed = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.error(e.stack);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') console.error(m.text());
  });
  page.on('requestfailed', (r) => failed.push(r.url()));
  await page.goto('http://127.0.0.1:5173/?renderer=webgl2');
  await page.waitForFunction(
    () => !!window.__CODEVERSE__,
    {},
    { timeout: 120000 },
  );
  await page.screenshot({
    path: 'docs/evidence/g1/first-playable.png',
    fullPage: true,
  });
  console.log(
    JSON.stringify(
      {
        state: await page.evaluate(() => window.__CODEVERSE__),
        errors,
        failed,
      },
      null,
      2,
    ),
  );
  await fs.writeFile(
    'docs/evidence/g1/browser-initial.json',
    JSON.stringify(
      {
        state: await page.evaluate(() => window.__CODEVERSE__),
        errors,
        failed,
        browser: await browser.version(),
        renderer:
          'Explicit SwiftShader software WebGL2, not HP Victus performance',
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await browser.close();
}
