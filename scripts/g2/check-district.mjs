/* global console, process, window */
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const b = await chromium.launch({
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
});
try {
  await fs.mkdir('docs/evidence/g2/traversal', { recursive: true });
  const p = await b.newPage({ viewport: { width: 640, height: 480 } }),
    errors = [],
    points = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:5173/?renderer=webgpu&renderAudit=1');
  await p.waitForFunction(() => !!window.__CODEVERSE__, null, {
    timeout: 120000,
  });
  await p.evaluate(() => {
    const s = window.__renderScene,
      update = s.onBeforeRenderObservable.observers.find(
        (o) => o.callback.name === 'update',
      ).callback;
    s.onBeforeRenderObservable.add(() => {
      for (let i = 0; i < 24; i++) {
        const g = window.__walkGoal,
          p = s.getTransformNodeByName('player-controller').position;
        if (!g || g.sign * (p[g.axis] - g.value) >= 0) break;
        update(s);
      }
    });
  });
  for (const [key, axis, value, sign] of [
    ['s', 'z', 25, 1],
    ['s', 'z', 39, 1],
    ['a', 'x', -29, -1],
    ['w', 'z', 12, -1],
    ['w', 'z', -16, -1],
    ['w', 'z', -42, -1],
    ['d', 'x', 0, 1],
    ['d', 'x', 29, 1],
    ['s', 'z', -12, 1],
    ['s', 'z', 20, 1],
    ['s', 'z', 40, 1],
    ['s', 'z', 68, 1],
    ['a', 'x', 0, -1],
    ['w', 'z', 38, -1],
  ]) {
    await p.evaluate((g) => (window.__walkGoal = g), { axis, value, sign });
    await p.keyboard.down('Shift');
    await p.keyboard.down(key);
    await p.waitForFunction(
      ({ axis, value, sign }) =>
        sign * (window.__CODEVERSE__[axis] - value) >= 0,
      { axis, value, sign },
      { timeout: 300000 },
    );
    if (key === 's' && value < 12) await p.waitForTimeout(2000);
    await p.keyboard.up(key);
    await p.keyboard.up('Shift');
    points.push(await p.evaluate(() => window.__CODEVERSE__));
    console.log(key, axis, value, points.at(-1).x, points.at(-1).z);
    if (key === 'w' && value === -16) {
      await p.mouse.move(500, 240);
      await p.mouse.down();
      await p.mouse.move(107, 240);
      await p.mouse.up();
      await p.waitForFunction(
        () => window.__renderScene.activeCamera.radius < 6.8,
        null,
        { timeout: 180000 },
      );
      const c = await p.evaluate(() => {
        const c = window.__renderScene.activeCamera;
        return {
          radius: c.radius,
          actual: c.position.subtract(c.target).length(),
          alpha: c.alpha,
          player: window.__CODEVERSE__,
        };
      });
      await fs.writeFile(
        'docs/evidence/g2/traversal/wall-clearance.json',
        JSON.stringify(c, null, 2),
      );
      await p.mouse.move(107, 240);
      await p.mouse.down();
      await p.mouse.move(500, 240);
      await p.mouse.up();
      await p.waitForFunction(
        () =>
          Math.abs(window.__renderScene.activeCamera.alpha - Math.PI / 2) <
          0.001,
        null,
        { timeout: 180000 },
      );
    }

    await p.evaluate(async () => {
      const s = window.__renderScene;
      await new Promise((resolve) =>
        s.onAfterRenderObservable.addOnce(resolve),
      );
      const e = s.getEngine();
      window.__captureLoops = [...e.activeRenderLoops];
      e.stopRenderLoop();
    });
    await p.screenshot({
      path: `docs/evidence/g2/traversal/${String(points.length).padStart(2, '0')}.jpg`,
      type: 'jpeg',
      quality: 88,
      timeout: 180000,
    });
    await p.evaluate(() => {
      const e = window.__renderScene.getEngine();
      for (const loop of window.__captureLoops) e.runRenderLoop(loop);
    });
  }
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => window.__CODEVERSE__.paused);
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => !window.__CODEVERSE__.paused);
  await p.setViewportSize({ width: 800, height: 500 });
  await p.keyboard.press('r');
  await p.waitForFunction(() => Math.abs(window.__CODEVERSE__.z - 18) < 0.05);
  await fs.writeFile(
    'docs/evidence/g2/traversal/walk.json',
    JSON.stringify(
      {
        points,
        errors,
        method:
          'Actual keyboard perimeter/approach/road traversal using existing collision controller, with up to 24 extra unchanged controller updates between drawn frames to accelerate slow software execution. No position assignment/teleport, no graphics setting reduction. Frame scheduling paused only for framebuffer readback, then resumed. Not real-time/performance or gait acceptance.',
      },
      null,
      2,
    ),
  );
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await b.close();
}
