# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: foundation.spec.ts >> forced WebGL2 initializes under StrictMode, resizes and restarts cleanly
- Location: tests/foundation.spec.ts:12:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 20

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+   "Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)",
+ ]
```

# Page snapshot

```yaml
- main [ref=f2e3]:
  - generic "CodeVerse playable third-person world" [ref=f2e5]
  - generic:
    - generic:
      - generic [aria-hidden]: CV
      - generic:
        - strong: CODEVERSE
        - generic: LEARN · PLAY · GROW
    - generic:
      - text: G1 / FIRST PLAYABLE
      - generic: WORK IN PROGRESS
  - complementary:
    - generic: ◈
    - generic:
      - text: EXPLORE CODEVERSE
      - heading "Central Plaza" [level=1]
      - paragraph: Make your way to the blue entrance marker.
  - complementary "Renderer diagnostics" [ref=f2e6]: WebGL2/DAYLIGHT
  - generic [ref=f2e8]:
    - generic [ref=f2e9]:
      - generic [ref=f2e10]: W A S D
      - text: Move
    - generic [ref=f2e11]:
      - generic [ref=f2e12]: SHIFT
      - text: Run
    - generic [ref=f2e13]: Drag mouse to orbit · Scroll to zoom
    - generic [ref=f2e14]:
      - generic [ref=f2e15]: ESC
      - text: Pause
    - button "Reset position R" [ref=f2e16] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | 
  3   | // These overrides exercise explicit capability failure paths; they do not
  4   | // simulate a successful WebGPU adapter or count as hardware validation.
  5   | const disableWebGPU = () => {
  6   |   Object.defineProperty(navigator, 'gpu', {
  7   |     configurable: true,
  8   |     value: undefined,
  9   |   });
  10  | };
  11  | 
  12  | test('forced WebGL2 initializes under StrictMode, resizes and restarts cleanly', async ({
  13  |   page,
  14  | }) => {
  15  |   const errors: string[] = [];
  16  |   page.on('pageerror', (error) => errors.push(error.message));
  17  |   page.on('console', (message) => {
  18  |     if (message.type() === 'error') errors.push(message.text());
  19  |   });
  20  |   await page.goto('/?renderer=webgl2');
  21  |   await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  22  |   await expect(page.locator('canvas')).toHaveCount(1);
  23  |   await expect(page.getByTestId('graphics-viewport')).toHaveAttribute(
  24  |     'data-buffer-size',
  25  |     '1440×900',
  26  |   );
  27  |   await expect(page.locator('canvas')).toHaveJSProperty('width', 1440);
  28  |   await expect(page.locator('canvas')).toHaveJSProperty('height', 900);
  29  |   await page.screenshot({
  30  |     timeout: 120_000,
  31  |     path: 'test-results/foundation-ready.png',
  32  |   });
  33  |   await page.setViewportSize({ width: 1280, height: 720 });
  34  |   await expect(page.getByTestId('graphics-viewport')).toHaveAttribute(
  35  |     'data-buffer-size',
  36  |     '1280×720',
  37  |   );
  38  |   await page.reload();
  39  |   await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  40  |   await expect(page.locator('canvas')).toHaveCount(1);
> 41  |   expect(errors).toEqual([]);
      |                  ^ Error: expect(received).toEqual(expected) // deep equality
  42  | });
  43  | 
  44  | test('automatic mode reports fallback when WebGPU is unavailable', async ({
  45  |   page,
  46  | }) => {
  47  |   await page.addInitScript(disableWebGPU);
  48  |   await page.goto('/');
  49  |   await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  50  |   await expect(page.getByTestId('fallback-reason')).toContainText(
  51  |     'WebGPU is unavailable',
  52  |   );
  53  |   await expect(page.locator('canvas')).toHaveCount(1);
  54  | });
  55  | 
  56  | test('forced WebGPU fails visibly and never falls back', async ({ page }) => {
  57  |   await page.addInitScript(disableWebGPU);
  58  |   await page.goto('/?renderer=webgpu');
  59  |   await expect(page.getByRole('alert')).toContainText('WebGPU is unavailable');
  60  |   await expect(page.getByTestId('active-backend')).toHaveCount(0);
  61  |   await expect(page.locator('canvas')).toHaveCount(0);
  62  |   await page.screenshot({
  63  |     timeout: 120_000,
  64  |     path: 'test-results/foundation-error.png',
  65  |   });
  66  |   await page.getByRole('button', { name: 'Retry initialization' }).click();
  67  |   await expect(page.getByRole('alert')).toBeVisible();
  68  | });
  69  | 
  70  | test('invalid explicit renderer is not silently ignored', async ({ page }) => {
  71  |   await page.goto('/?renderer=webgl1');
  72  |   await expect(page.getByRole('alert')).toContainText('Unknown renderer');
  73  |   await expect(page.locator('canvas')).toHaveCount(0);
  74  | });
  75  | 
  76  | test('both unavailable backends produce an actionable failure', async ({
  77  |   page,
  78  | }) => {
  79  |   await page.addInitScript(disableWebGPU);
  80  |   await page.addInitScript(() => {
  81  |     const getContext = HTMLCanvasElement.prototype.getContext;
  82  |     HTMLCanvasElement.prototype.getContext = function (
  83  |       this: HTMLCanvasElement,
  84  |       ...args: Parameters<typeof getContext>
  85  |     ) {
  86  |       if (args[0] === 'webgl2') return null;
  87  |       return getContext.apply(this, args);
  88  |     } as typeof getContext;
  89  |   });
  90  |   await page.goto('/');
  91  |   await expect(page.getByRole('alert')).toContainText(
  92  |     'WebGL2 is unavailable or disabled',
  93  |   );
  94  |   await expect(page.getByRole('alert')).toContainText('hardware acceleration');
  95  |   await expect(page.locator('canvas')).toHaveCount(0);
  96  | });
  97  | 
  98  | test('loading state is branded and makes no gameplay promises', async ({
  99  |   page,
  100 | }) => {
  101 |   await page.addInitScript(() => {
  102 |     Object.defineProperty(navigator, 'gpu', {
  103 |       configurable: true,
  104 |       value: {
  105 |         requestAdapter: () => new Promise(() => {}),
  106 |       },
  107 |     });
  108 |   });
  109 |   await page.goto('/?renderer=webgpu');
  110 |   await expect(page.getByRole('status')).toContainText(
  111 |     'Preparing the world, character and graphics backend.',
  112 |   );
  113 |   await expect(page.getByRole('status')).toContainText('No account required');
  114 |   await page.screenshot({
  115 |     timeout: 120_000,
  116 |     path: 'test-results/foundation-loading.png',
  117 |   });
  118 | });
  119 | 
  120 | test('WebGL context loss surfaces a failure instead of remaining ready', async ({
  121 |   page,
  122 | }) => {
  123 |   await page.goto('/?renderer=webgl2');
  124 |   await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  125 |   const supported = await page
  126 |     .locator('canvas')
  127 |     .evaluate((canvas: HTMLCanvasElement) => {
  128 |       const extension = canvas
  129 |         .getContext('webgl2')
  130 |         ?.getExtension('WEBGL_lose_context');
  131 |       extension?.loseContext();
  132 |       return !!extension;
  133 |     });
  134 |   expect(supported, 'Test browser must expose WEBGL_lose_context').toBe(true);
  135 |   await expect(page.getByRole('alert')).toContainText('context was lost');
  136 |   await expect(page.getByTestId('active-backend')).toHaveCount(0);
  137 | });
  138 | 
  139 | test('unmodified automatic selection initializes an available real backend', async ({
  140 |   page,
  141 | }) => {
```