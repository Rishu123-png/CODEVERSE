import { captureFrame } from './captureFrame';
import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import { SPAWN } from '../src/game/movement';
const evidence =
  process.env.E2E_EVIDENCE || 'docs/evidence/g1-visual/controller';

test('G1 actual keyboard traversal, collision, entrance information, pause and reset', async ({
  page,
}) => {
  // Software rasterization is not a frame-rate benchmark. Keep all real input,
  // collision and rendered-image assertions; allow its slow mouse/readback steps.
  test.setTimeout(
    process.env.PLAYWRIGHT_SOFTWARE_RENDERING === '1' ? 1_800_000 : 600_000,
  );
  const errors: string[] = [],
    failed: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => failed.push(r.url()));
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto('/?renderer=webgl2&renderAudit=1');
  await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  await page.waitForFunction(() => !!window.__CODEVERSE__);
  // Optional software-only route acceleration: same native keys and collision
  // controller, four extra updates per draw. Never a gait/FPS acceptance run.
  if (process.env.PLAYWRIGHT_ACCELERATE_CONTROLLER === '1')
    await page.evaluate(() => {
      const s = window.__renderScene!;
      const update = s.onBeforeRenderObservable.observers.find(
        (o) => o.callback.name === 'update',
      )?.callback;
      if (!update) throw new Error('Unchanged controller update not found');
      s.onBeforeRenderObservable.add((scene, event) => {
        for (let i = 0; i < 4; i++) update(scene, event);
      });
    });

  await fs.mkdir(evidence, { recursive: true });
  const initial = await page.evaluate(() => window.__CODEVERSE__);
  expect(initial?.skeletons).toBe(1);
  expect(initial?.animationGroups).toBe(3);
  await captureFrame(page, {
    timeout: 120_000,
    path: `${evidence}/playable-spawn.png`,
  });
  // Smaller viewport speeds up software rendering, not a performance benchmark.
  await page.setViewportSize({ width: 640, height: 480 });
  await page.keyboard.down('w');
  await page.waitForFunction(() => window.__CODEVERSE__!.z < 17.3);
  expect((await page.evaluate(() => window.__CODEVERSE__))?.motion).toBe(
    'Walk',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Game paused' })).toBeVisible();
  await page.waitForFunction(() => window.__CODEVERSE__!.paused);
  const paused = await page.evaluate(() => window.__CODEVERSE__);
  expect(paused!.paused).toBe(true);
  await page.waitForTimeout(400);
  expect(
    Math.abs((await page.evaluate(() => window.__CODEVERSE__!.z)) - paused!.z),
  ).toBeLessThan(0.1);
  await page.keyboard.up('w');
  await page.getByRole('button', { name: 'Continue exploring' }).click();
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await page.waitForFunction(() => window.__CODEVERSE__!.z < 16.5);
  expect((await page.evaluate(() => window.__CODEVERSE__))?.motion).toBe('Run');
  await page.waitForFunction(() => window.__CODEVERSE__!.near);
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  await expect(page.getByTestId('interact-prompt')).toBeVisible();
  await page.keyboard.press('e');
  await expect(
    page.getByRole('dialog', { name: 'Central Plaza information' }),
  ).toBeVisible();
  await captureFrame(page, {
    timeout: 120_000,
    path: `${evidence}/playable-information.png`,
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await page.waitForFunction(() => window.__CODEVERSE__!.z < 0.5);
  await page.waitForFunction(() => window.__CODEVERSE__!.motion === 'Idle');
  const wall = await page.evaluate(() => window.__CODEVERSE__);
  expect(wall!.z).toBeGreaterThanOrEqual(0.29);
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  await page.keyboard.press('r');
  await page.waitForFunction(
    () => Math.abs(window.__CODEVERSE__!.z - 18) < 0.05,
  );
  expect((await page.evaluate(() => window.__CODEVERSE__))?.x).toBeCloseTo(0);
  // Follow the pedestrian connection, ramp and continuous district to its developed boundary.
  await page.keyboard.down('Shift');
  await page.keyboard.down('s');
  await page.waitForFunction(
    () => window.__CODEVERSE__!.z > 24.2,
    {},
    { timeout: 120_000 },
  );
  const road = await page.evaluate(() => window.__CODEVERSE__);
  expect(road!.playerY).toBeCloseTo(-0.15);
  await page.waitForFunction(
    () => window.__CODEVERSE__!.z > 73.4,
    {},
    // The district leg is now ~50m, not the old 8m plaza boundary leg.
    // Software rasterization deliberately keeps the same collision/graphics checks.
    {
      timeout:
        process.env.PLAYWRIGHT_SOFTWARE_RENDERING === '1' ? 600_000 : 120_000,
    },
  );
  await page.waitForFunction(() => window.__CODEVERSE__!.motion === 'Idle');
  const boundary = await page.evaluate(() => window.__CODEVERSE__);
  expect(boundary!.z).toBeLessThanOrEqual(74);
  await page.keyboard.up('s');
  await page.keyboard.up('Shift');
  await page.keyboard.press('r');
  await page.waitForFunction(
    () => Math.abs(window.__CODEVERSE__!.z - 18) < 0.05,
  );
  // Drag/zoom real camera input must not move the player or create another canvas.
  await page.setViewportSize({ width: 960, height: 600 });
  const cameraBefore = await page.evaluate(() => window.__CODEVERSE__);
  await page.mouse.move(550, 280);
  await page.mouse.down();
  await page.mouse.move(760, 320, { steps: 8 });
  await page.mouse.up();
  await page.mouse.wheel(0, 180);
  await page.waitForFunction(
    (alpha) => Math.abs(window.__CODEVERSE__!.cameraAlpha - alpha) > 0.05,
    cameraBefore!.cameraAlpha,
  );
  await expect(page.locator('canvas')).toHaveCount(1);
  expect((await page.evaluate(() => window.__CODEVERSE__))?.z).toBeCloseTo(
    SPAWN.z,
  );
  await page.setViewportSize({ width: 960, height: 600 });
  await captureFrame(page, {
    timeout: 120_000,
    path: `${evidence}/playable-orbit.png`,
  });
  await fs.writeFile(
    `${evidence}/browser-playable.json`,
    JSON.stringify(
      {
        controllerAcceleration:
          process.env.PLAYWRIGHT_ACCELERATE_CONTROLLER === '1'
            ? '4 extra unchanged controller updates per drawn frame; no gait/FPS claim'
            : 'none',
        initial,
        paused,
        wall,
        road,
        boundary,
        cameraBefore,
        cameraAfter: await page.evaluate(() => window.__CODEVERSE__),
        errors,
        failed,
        environment:
          'Chromium software SwiftShader WebGL2; framebuffer readback paused only during snapshots; not uninterrupted video or laptop/GPU/FPS proof',
      },
      null,
      2,
    ) + '\n',
  );
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});
