/* global console, process, window, setInterval */
import { chromium, expect } from '@playwright/test';
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
  await fs.mkdir('docs/evidence/g1-graphics/after', { recursive: true });
  const p = await b.newPage({ viewport: { width: 640, height: 480 } }),
    errors = [],
    points = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:5173/?renderer=webgpu&renderAudit=1');
  await p.waitForFunction(() => !!window.__CODEVERSE__, null, {
    timeout: 120000,
  });
  // Supplementary motion poses use ordinary frames/input BEFORE route acceleration.
  const poses = [];
  await p.setViewportSize({ width: 1280, height: 800 });
  for (const motion of ['Walk', 'Run']) {
    if (motion === 'Run') await p.keyboard.down('Shift');
    await p.keyboard.down('w');
    await p.waitForFunction((m) => window.__CODEVERSE__.motion === m, motion, {
      timeout: 120000,
    });
    await p.screenshot({
      path: `docs/evidence/g1-graphics/after/${motion.toLowerCase()}.png`,
      timeout: 120000,
    });
    poses.push(
      await p.evaluate(() => ({
        state: window.__CODEVERSE__,
        clips: window.__renderScene.animationGroups.map((g) => ({
          name: g.name,
          playing: g.isPlaying,
          frame: g.animatables[0]?.masterFrame,
          speed: g.speedRatio,
        })),
      })),
    );
    await p.keyboard.up('w');
    await p.keyboard.up('Shift');
  }
  await p.keyboard.press('r');
  await p.waitForFunction(() => Math.abs(window.__CODEVERSE__.z - 18) < 0.05);
  await p.setViewportSize({ width: 640, height: 480 });
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
  await p.exposeFunction('progress', (s) =>
    console.log('position', s?.x, s?.z, s?.motion, s?.paused),
  );
  await p.evaluate(() =>
    setInterval(() => window.progress(window.__CODEVERSE__), 15000),
  );
  for (const [key, axis, value, sign] of [
    ['w', 'z', 10, -1],
    ['d', 'x', 5, 1],
    ['s', 'z', 11.85, 1],
    ['d', 'x', 20, 1],
    ['w', 'z', 4, -1],
    ['w', 'z', -26, -1],
    ['a', 'x', -20, -1],
    ['s', 'z', 11.9, 1],
    ['d', 'x', 0, 1],
    ['s', 'z', 31.7, 1],
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
    if (key === 'w' && value === 4) {
      await p.evaluate(() => {
        const scene = window.__renderScene,
          c = scene.activeCamera;
        c.alpha = Math.atan2(-1, -2.5);
        c.beta = 1.04;
        c.radius = 8;
        window.__clearanceSamples = [];
        window.__clearanceObserver = scene.onBeforeRenderObservable.add(() =>
          window.__clearanceSamples.push(c.radius),
        );
      });
      await p.waitForFunction(
        () => window.__clearanceSamples.length >= 3,
        null,
        { timeout: 120000 },
      );
      const samples = await p.evaluate(() => window.__clearanceSamples);
      expect(Math.min(...samples)).toBeLessThan(7.5);
      await p.setViewportSize({ width: 1280, height: 800 });
      await p.screenshot({
        path: 'docs/evidence/g1-graphics/after/canopy-clearance.png',
        timeout: 120000,
      });
      await fs.writeFile(
        'docs/evidence/g1-graphics/after/canopy-clearance.json',
        JSON.stringify(
          {
            samples,
            requestedRadius: 8,
            method:
              'Player reached tree by actual keyboard/collision route. Camera-only diagnostic orbit, actual runtime shortening. No player teleport.',
          },
          null,
          2,
        ),
      );
      await p.evaluate(() => {
        const s = window.__renderScene;
        s.onBeforeRenderObservable.remove(window.__clearanceObserver);
        const c = s.activeCamera;
        c.alpha = Math.PI / 2;
        c.beta = 1.65;
        c.radius = 5.8;
      });
      await p.setViewportSize({ width: 640, height: 480 });
    }
  }
  await p.keyboard.press('r');
  await p.waitForFunction(() => Math.abs(window.__CODEVERSE__.z - 18) < 0.05);
  await fs.writeFile(
    'docs/evidence/g1-graphics/after/walk.json',
    JSON.stringify(
      {
        points,
        poses,
        errors,
        method:
          'Actual keyboard perimeter/approach/road traversal using existing collision controller, with up to 24 extra unchanged controller updates between drawn frames to accelerate slow software execution. No position assignment/teleport, no graphics setting reduction. Not real-time/performance or gait acceptance.',
      },
      null,
      2,
    ),
  );
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await b.close();
}
