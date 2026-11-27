/* global process, console, window */
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
      viewport: { width: 1440, height: 1000 },
    }),
    errors = [],
    external = [],
    failed = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.error(e.stack);
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
      external.push(url);
      await route.abort();
    } else await route.continue();
  });
  await page.goto('http://127.0.0.1:5181/landmark.html');
  await page.waitForFunction(
    () => window.landmarkReady === true,
    {},
    { timeout: 60000 },
  );
  const report = await page.evaluate(() => window.landmarkEvidence);
  console.log('Imported bounds:', JSON.stringify(report.bounds));
  const built = JSON.parse(
    await fs.readFile('docs/evidence/a1-runtime/landmark-study.json', 'utf8'),
  );
  assert.equal(report.compressed.triangles, built.triangles);
  assert.equal(report.compressed.meshes, built.batches);
  assert.deepEqual(report.compressed, report.uncompressed);
  assert.equal(report.lifecycle.length, 3);
  assert(Math.abs(report.bounds.min[0] - (-21 + 0.0075)) < 0.001);
  assert(Math.abs(report.bounds.max[2] - 32) < 0.001);
  assert(Math.abs(report.bounds.max[1] - 24.8) < 0.002);
  report.boundsToleranceMeters = 0.002;
  report.screenshots = [];
  report.views = {};
  for (const view of ['front', 'rear', 'site']) {
    report.views[view] = await page.evaluate(
      (name) => window.landmarkView(name),
      view,
    );
    assert(
      view === 'rear'
        ? report.views[view].position[2] < -10
        : report.views[view].position[2] > 0,
    );
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          window.requestAnimationFrame(() =>
            window.requestAnimationFrame(resolve),
          ),
        ),
    );
    const file = 'docs/evidence/a1-runtime/landmark-' + view + '.png';
    await page.screenshot({ path: file, fullPage: true });
    report.screenshots.push(file);
  }
  report.disposal = await page.evaluate(() => window.landmarkDispose());
  assert.equal(report.disposal.sceneDisposed, true);
  assert.equal(report.disposal.engineScenes, 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(failed, []);
  report.pageErrors = errors;
  report.externalNetworkRequests = external;
  report.failedRequests = failed;
  report.browser = await browser.version();
  report.renderer =
    'Explicit SwiftShader launch; not physical-GPU performance evidence';
  await fs.writeFile(
    'docs/evidence/a1-runtime/landmark-browser.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
