/* global console, process, window */
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const folder = process.env.VISUAL_EVIDENCE || 'docs/evidence/g1-visual/pass-2';
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: [
    '--no-sandbox',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--enable-unsafe-webgpu',
    '--enable-features=Vulkan',
    '--use-vulkan=swiftshader',
    '--disable-vulkan-surface',
  ],
  env: process.env,
});
try {
  const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    }),
    logs = [],
    errors = [],
    failed = [];
  page.on('console', (m) => logs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => errors.push(e.stack));
  page.on('requestfailed', (r) => failed.push(r.url()));
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(
    process.env.VISUAL_URL ||
      'http://localhost:4173/?renderer=webgpu&renderAudit=1',
  );
  await page.waitForFunction(() => !!window.__renderScene, null, {
    timeout: 120000,
  });
  await page.waitForFunction(() => window.__renderScene.isReady(), null, {
    timeout: 120000,
  });
  await fs.writeFile(
    folder + '/initial-audit.json',
    JSON.stringify(
      {
        logs,
        errors,
        failed,
        audit: await page.evaluate(() => window.__renderAudit()),
      },
      null,
      2,
    ) + '\n',
  );
  await page.screenshot({ path: folder + '/spawn.png', timeout: 120000 });
  const views = {
    overview: [
      [29, 23, 43],
      [0, 5, 0],
    ],
    entrance: [
      [10, 6.5, 16],
      [0, 4, 0.5],
    ],
    plaza: [
      [-20, 11, 22],
      [0, 1.5, 6],
    ],
    road: [
      [17, 9, 38],
      [0, 0.1, 27],
    ],
    vegetation: [
      [12, 3.5, 13],
      [17.5, 3.2, 3],
    ],
    character: [
      [-0.6, 1.6, 14.7],
      [0, 1.1, 18],
    ],
  };
  for (const name of process.env.VISUAL_VIEWS
    ? process.env.VISUAL_VIEWS.split(',')
    : Object.keys(views)) {
    const [from, to] = views[name];
    await page.evaluate(
      ({ from, to }) => {
        const s = window.__renderScene,
          c = s.activeCamera,
          V = c.target.constructor;
        c.upperRadiusLimit = 100;
        c.lowerRadiusLimit = 0.5;
        window.__visualCamera = s.onBeforeRenderObservable.add(() => {
          c.setTarget(new V(...to));
          c.setPosition(new V(...from));
        });
      },
      { from, to },
    );
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${folder}/${name}.png`, timeout: 120000 });
    await page.evaluate(() =>
      window.__renderScene.onBeforeRenderObservable.remove(
        window.__visualCamera,
      ),
    );
  }
  const report = {
    browser: await browser.version(),
    backend: await page.getByTestId('active-backend').textContent(),
    environment:
      'Software Vulkan/SwiftShader WebGPU; not physical laptop/FPS acceptance',
    logs,
    errors,
    failed,
    audit: await page.evaluate(() => window.__renderAudit()),
  };
  await fs.writeFile(
    folder + '/browser.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
  expect(
    logs.filter(
      (l) =>
        l.type === 'error' ||
        /GPUValidationError|uncaptured error|Destroyed texture/i.test(l.text),
    ),
  ).toEqual([]);
  console.log('Captured actual production views:', folder, report.backend);
} finally {
  await browser.close();
}
