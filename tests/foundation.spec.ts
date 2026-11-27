import { captureFrame } from './captureFrame';
import { expect, test } from '@playwright/test';

// These overrides exercise explicit capability failure paths; they do not
// simulate a successful WebGPU adapter or count as hardware validation.
const disableWebGPU = () => {
  Object.defineProperty(navigator, 'gpu', {
    configurable: true,
    value: undefined,
  });
};

test('forced WebGL2 initializes under StrictMode, resizes and restarts cleanly', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/?renderer=webgl2&renderAudit=1');
  await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByTestId('graphics-viewport')).toHaveAttribute(
    'data-buffer-size',
    '1440×900',
  );
  await expect(page.locator('canvas')).toHaveJSProperty('width', 1440);
  await expect(page.locator('canvas')).toHaveJSProperty('height', 900);
  await captureFrame(page, {
    timeout: 120_000,
    path: 'test-results/foundation-ready.png',
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByTestId('graphics-viewport')).toHaveAttribute(
    'data-buffer-size',
    '1280×720',
  );
  await page.reload();
  await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('automatic mode reports fallback when WebGPU is unavailable', async ({
  page,
}) => {
  await page.addInitScript(disableWebGPU);
  await page.goto('/');
  await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  await expect(page.getByTestId('fallback-reason')).toContainText(
    'WebGPU is unavailable',
  );
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('forced WebGPU fails visibly and never falls back', async ({ page }) => {
  await page.addInitScript(disableWebGPU);
  await page.goto('/?renderer=webgpu');
  await expect(page.getByRole('alert')).toContainText('WebGPU is unavailable');
  await expect(page.getByTestId('active-backend')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
  await captureFrame(page, {
    timeout: 120_000,
    path: 'test-results/foundation-error.png',
  });
  await page.getByRole('button', { name: 'Retry initialization' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('invalid explicit renderer is not silently ignored', async ({ page }) => {
  await page.goto('/?renderer=webgl1');
  await expect(page.getByRole('alert')).toContainText('Unknown renderer');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('both unavailable backends produce an actionable failure', async ({
  page,
}) => {
  await page.addInitScript(disableWebGPU);
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof getContext>
    ) {
      if (args[0] === 'webgl2') return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(
    'WebGL2 is unavailable or disabled',
  );
  await expect(page.getByRole('alert')).toContainText('hardware acceleration');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('loading state is branded and makes no gameplay promises', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', {
      configurable: true,
      value: {
        requestAdapter: () => new Promise(() => {}),
      },
    });
  });
  await page.goto('/?renderer=webgpu');
  await expect(page.getByRole('status')).toContainText(
    'Preparing the world, character and graphics backend.',
  );
  await expect(page.getByRole('status')).toContainText('No account required');
  await captureFrame(page, {
    timeout: 120_000,
    path: 'test-results/foundation-loading.png',
  });
});

test('WebGL context loss surfaces a failure instead of remaining ready', async ({
  page,
}) => {
  await page.goto('/?renderer=webgl2&renderAudit=1');
  await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  const supported = await page
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) => {
      const extension = canvas
        .getContext('webgl2')
        ?.getExtension('WEBGL_lose_context');
      extension?.loseContext();
      return !!extension;
    });
  expect(supported, 'Test browser must expose WEBGL_lose_context').toBe(true);
  await expect(page.getByRole('alert')).toContainText('context was lost');
  await expect(page.getByTestId('active-backend')).toHaveCount(0);
});

test('unmodified automatic selection initializes an available real backend', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('active-backend')).toHaveText(
    /^(WebGPU|WebGL2)$/,
  );
  await expect(page.locator('canvas')).toHaveCount(1);
  console.log(
    'Actual automatic backend:',
    await page.getByTestId('active-backend').textContent(),
  );
});
