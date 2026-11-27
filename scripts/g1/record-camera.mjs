/* global console, process, window */
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const folder = process.env.MOTION_EVIDENCE || 'docs/evidence/g2/before-camera';
const backend = process.env.MOTION_BACKEND || 'webgpu';
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: [
    '--no-sandbox',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--enable-unsafe-webgpu',
    ...(backend === 'webgpu'
      ? [
          '--enable-features=Vulkan',
          '--use-vulkan=swiftshader',
          '--disable-vulkan-surface',
        ]
      : []),
  ],
});
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } }),
    errors = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    console.error(e.message);
  });
  await page.goto(
    `http://localhost:${process.env.MOTION_PORT || 5173}/?renderer=${backend}&renderAudit=1`,
  );
  await page.waitForFunction(() => window.__renderScene?.isReady(), null, {
    timeout: 180000,
  });
  await page.evaluate(() => {
    const s = window.__renderScene,
      c = s.activeCamera;
    window.__motion = [];
    window.__motionPhase = 'settle';
    s.onBeforeRenderObservable.add(() => {
      window.__motion.push({
        phase: window.__motionPhase,
        stage: 'before',
        frame: s.getFrameId(),
        alpha: c.alpha,
        beta: c.beta,
        radius: c.radius,
        actual: c.position.subtract(c.target).length(),
        target: c.target.asArray(),
        position: c.position.asArray(),
        player: s
          .getTransformNodeByName('player-controller')
          .position.asArray(),
      });
    });
    s.onAfterRenderObservable.add(() => {
      window.__motion.push({
        phase: window.__motionPhase,
        stage: 'after',
        frame: s.getFrameId(),
        alpha: c.alpha,
        beta: c.beta,
        radius: c.radius,
        actual: c.position.subtract(c.target).length(),
        position: c.position.asArray(),
      });
    });
  });
  let index = 0;
  const shot = async () => {
    await page.evaluate(async () => {
      const s = window.__renderScene;
      await new Promise((resolve) =>
        s.onAfterRenderObservable.addOnce(resolve),
      );
      const e = s.getEngine();
      window.__captureLoops = [...e.activeRenderLoops];
      e.stopRenderLoop();
    });
    await page.screenshot({
      path: `${folder}/${String(index++).padStart(3, '0')}.jpg`,
      type: 'jpeg',
      quality: 85,
      timeout: 180000,
    });
    await page.evaluate(() => {
      const e = window.__renderScene.getEngine();
      for (const loop of window.__captureLoops) e.runRenderLoop(loop);
    });
  };
  for (const [phase, key, step, count] of [
    ['stationary-slow', null, 14, 6],
    ['stationary-fast', null, -60, 6],
    ['walking', 'w', 18, 6],
    ['running', 'w', -22, 6],
    ['zoom', null, 0, 4],
  ]) {
    await page.evaluate((v) => (window.__motionPhase = v), phase);
    if (phase === 'running') await page.keyboard.down('Shift');
    if (key) await page.keyboard.down(key);
    await page.mouse.move(320, 240);
    await page.mouse.down();
    for (let n = 0; n < count; n++) {
      await page.mouse.move(
        320 + (n + 1) * step,
        240 + (phase === 'stationary-fast' ? n * 3 : 0),
      );
      if (phase === 'zoom') await page.mouse.wheel(0, n < 2 ? 150 : -150);
      await shot();
    }
    await page.mouse.up();
    if (key) await page.keyboard.up(key);
    await page.keyboard.up('Shift');
    console.log(phase, index);
  }
  const telemetry = await page.evaluate(() => window.__motion);
  await fs.writeFile(
    folder + '/motion.json',
    JSON.stringify(
      {
        backend,
        errors,
        method:
          'Actual native mouse/key/wheel input, live game/render loop, successive captured frames at 640x400. Software rendering, not native FPS or laptop proof. Frame sequence playback is explicitly retimed. Render scheduling is paused only for framebuffer readback and resumed between native inputs; this is not uninterrupted real-time video. Telemetry covers the live frames.',
        telemetry,
      },
      null,
      2,
    ),
  );
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await browser.close();
}
