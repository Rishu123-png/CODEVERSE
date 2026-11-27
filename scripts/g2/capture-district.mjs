/* global console, process, window */
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const folder = process.env.VISUAL_EVIDENCE || 'docs/evidence/g2/pass-1';
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
  page.on('console', (m) => {
    logs.push({ type: m.type(), text: m.text() });
    if (m.type() === 'error' || m.type() === 'warning') console.error(m.text());
  });
  page.on('pageerror', (e) => {
    errors.push(e.stack);
    console.error(e.stack);
  });
  page.on('requestfailed', (r) => failed.push(r.url()));
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(
    process.env.VISUAL_URL ||
      'http://localhost:4173/?renderer=webgpu&renderAudit=1',
  );
  await page
    .waitForFunction(() => !!window.__renderScene, null, {
      timeout: 120000,
    })
    .catch(async (e) => {
      await fs.writeFile(
        folder + '/load-failure.json',
        JSON.stringify(
          {
            logs,
            errors,
            failed,
            body: await page.locator('body').innerText(),
          },
          null,
          2,
        ),
      );
      throw e;
    });
  await page.waitForFunction(() => window.__renderScene.isReady(), null, {
    timeout: 120000,
  });
  // Let animation/skeleton and reflection warm-up reach an ordinary settled frame.
  await page.waitForFunction(
    () => window.__renderScene.getFrameId() >= 10,
    null,
    { timeout: 180000 },
  );
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
  const readback = async (options) => {
    await page.evaluate(async () => {
      const s = window.__renderScene;
      await new Promise((resolve) =>
        s.onAfterRenderObservable.addOnce(resolve),
      );
      const e = s.getEngine();
      window.__captureLoops = [...e.activeRenderLoops];
      e.stopRenderLoop();
    });
    await page.screenshot(options);
    await page.evaluate(() => {
      const e = window.__renderScene.getEngine();
      for (const loop of window.__captureLoops) e.runRenderLoop(loop);
    });
  };
  await readback({
    path: folder + '/spawn.jpg',
    type: 'jpeg',
    quality: 94,
    timeout: 180000,
  });
  const views = {
    expanded: [
      [-35, 3.2, 31],
      [-35, 3, -20],
    ],
    intersection: [
      [-20, 9, 41],
      [-29, 1, 28],
    ],
    architecture: [
      [35, 7, 34],
      [43, 8, -8],
    ],
    roofs: [
      [62, 52, 77],
      [0, 1, 5],
    ],
    exterior: [
      [-19, 8, 26],
      [0, 7, -4],
    ],
    secondary: [
      [-19, 2.4, -17],
      [-12, 6, -6],
    ],
    depth: [
      [-5, 3, 32],
      [0, 7, -18],
    ],
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
    await readback({
      path: `${folder}/${name}.jpg`,
      type: 'jpeg',
      quality: 94,
      timeout: 180000,
    });
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
      'Software Vulkan/SwiftShader WebGPU; frame scheduling paused only during framebuffer readback; not continuous video or physical laptop/FPS acceptance',
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
