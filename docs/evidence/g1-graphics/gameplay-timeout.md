# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playable.spec.ts >> G1 actual keyboard traversal, collision, entrance information, pause and reset
- Location: tests/playable.spec.ts:7:1

# Error details

```
Test timeout of 600000ms exceeded.
```

```
Error: mouse.move: Test timeout of 600000ms exceeded.
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic "CodeVerse playable third-person world" [active] [ref=e5]
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
  - complementary "Renderer diagnostics" [ref=e6]: WebGL2/DAYLIGHT
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]: W A S D
      - text: Move
    - generic [ref=e11]:
      - generic [ref=e12]: SHIFT
      - text: Run
    - generic [ref=e13]: Drag mouse to orbit · Scroll to zoom
    - generic [ref=e14]:
      - generic [ref=e15]: ESC
      - text: Pause
    - button "Reset position R" [ref=e16] [cursor=pointer]
```

# Test source

```ts
  5   |   process.env.E2E_EVIDENCE || 'docs/evidence/g1-visual/controller';
  6   | 
  7   | test('G1 actual keyboard traversal, collision, entrance information, pause and reset', async ({
  8   |   page,
  9   | }) => {
  10  |   test.setTimeout(600_000);
  11  |   const errors: string[] = [],
  12  |     failed: string[] = [];
  13  |   page.on('pageerror', (e) => errors.push(e.message));
  14  |   page.on('requestfailed', (r) => failed.push(r.url()));
  15  |   await page.setViewportSize({ width: 960, height: 600 });
  16  |   await page.goto('/?renderer=webgl2');
  17  |   await expect(page.getByTestId('active-backend')).toHaveText('WebGL2');
  18  |   await page.waitForFunction(() => !!window.__CODEVERSE__);
  19  |   await fs.mkdir(evidence, { recursive: true });
  20  |   const initial = await page.evaluate(() => window.__CODEVERSE__);
  21  |   expect(initial?.skeletons).toBe(1);
  22  |   expect(initial?.animationGroups).toBe(3);
  23  |   await page.screenshot({
  24  |     timeout: 120_000,
  25  |     path: `${evidence}/playable-spawn.png`,
  26  |   });
  27  |   // Smaller viewport speeds up software rendering, not a performance benchmark.
  28  |   await page.setViewportSize({ width: 640, height: 480 });
  29  |   await page.keyboard.down('w');
  30  |   await page.waitForFunction(() => window.__CODEVERSE__!.z < 17.3);
  31  |   expect((await page.evaluate(() => window.__CODEVERSE__))?.motion).toBe(
  32  |     'Walk',
  33  |   );
  34  |   await page.keyboard.press('Escape');
  35  |   await expect(page.getByRole('dialog', { name: 'Game paused' })).toBeVisible();
  36  |   await page.waitForFunction(() => window.__CODEVERSE__!.paused);
  37  |   const paused = await page.evaluate(() => window.__CODEVERSE__);
  38  |   expect(paused!.paused).toBe(true);
  39  |   await page.waitForTimeout(400);
  40  |   expect(
  41  |     Math.abs((await page.evaluate(() => window.__CODEVERSE__!.z)) - paused!.z),
  42  |   ).toBeLessThan(0.1);
  43  |   await page.keyboard.up('w');
  44  |   await page.getByRole('button', { name: 'Continue exploring' }).click();
  45  |   await page.keyboard.down('Shift');
  46  |   await page.keyboard.down('w');
  47  |   await page.waitForFunction(() => window.__CODEVERSE__!.z < 16.5);
  48  |   expect((await page.evaluate(() => window.__CODEVERSE__))?.motion).toBe('Run');
  49  |   await page.waitForFunction(() => window.__CODEVERSE__!.near);
  50  |   await page.keyboard.up('w');
  51  |   await page.keyboard.up('Shift');
  52  |   await expect(page.getByTestId('interact-prompt')).toBeVisible();
  53  |   await page.keyboard.press('e');
  54  |   await expect(
  55  |     page.getByRole('dialog', { name: 'Central Plaza information' }),
  56  |   ).toBeVisible();
  57  |   await page.screenshot({
  58  |     timeout: 120_000,
  59  |     path: `${evidence}/playable-information.png`,
  60  |   });
  61  |   await page.keyboard.press('Escape');
  62  |   await expect(page.getByRole('dialog')).toHaveCount(0);
  63  |   await page.keyboard.down('Shift');
  64  |   await page.keyboard.down('w');
  65  |   await page.waitForFunction(() => window.__CODEVERSE__!.z < 0.5);
  66  |   await page.waitForFunction(() => window.__CODEVERSE__!.motion === 'Idle');
  67  |   const wall = await page.evaluate(() => window.__CODEVERSE__);
  68  |   expect(wall!.z).toBeGreaterThanOrEqual(0.29);
  69  |   await page.keyboard.up('w');
  70  |   await page.keyboard.up('Shift');
  71  |   await page.keyboard.press('r');
  72  |   await page.waitForFunction(
  73  |     () => Math.abs(window.__CODEVERSE__!.z - 18) < 0.05,
  74  |   );
  75  |   expect((await page.evaluate(() => window.__CODEVERSE__))?.x).toBeCloseTo(0);
  76  |   // Walk backwards along the actual pedestrian connection, ramp and bounded road.
  77  |   await page.keyboard.down('Shift');
  78  |   await page.keyboard.down('s');
  79  |   await page.waitForFunction(
  80  |     () => window.__CODEVERSE__!.z > 24.2,
  81  |     {},
  82  |     { timeout: 120_000 },
  83  |   );
  84  |   const road = await page.evaluate(() => window.__CODEVERSE__);
  85  |   expect(road!.playerY).toBeCloseTo(-0.15);
  86  |   await page.waitForFunction(
  87  |     () => window.__CODEVERSE__!.z > 31.7,
  88  |     {},
  89  |     { timeout: 120_000 },
  90  |   );
  91  |   await page.waitForFunction(() => window.__CODEVERSE__!.motion === 'Idle');
  92  |   const boundary = await page.evaluate(() => window.__CODEVERSE__);
  93  |   expect(boundary!.z).toBeLessThanOrEqual(32);
  94  |   await page.keyboard.up('s');
  95  |   await page.keyboard.up('Shift');
  96  |   await page.keyboard.press('r');
  97  |   await page.waitForFunction(
  98  |     () => Math.abs(window.__CODEVERSE__!.z - 18) < 0.05,
  99  |   );
  100 |   // Drag/zoom real camera input must not move the player or create another canvas.
  101 |   await page.setViewportSize({ width: 960, height: 600 });
  102 |   const cameraBefore = await page.evaluate(() => window.__CODEVERSE__);
  103 |   await page.mouse.move(550, 280);
  104 |   await page.mouse.down();
> 105 |   await page.mouse.move(760, 320, { steps: 8 });
      |                    ^ Error: mouse.move: Test timeout of 600000ms exceeded.
  106 |   await page.mouse.up();
  107 |   await page.mouse.wheel(0, 180);
  108 |   await page.waitForFunction(
  109 |     (alpha) => Math.abs(window.__CODEVERSE__!.cameraAlpha - alpha) > 0.05,
  110 |     cameraBefore!.cameraAlpha,
  111 |   );
  112 |   await expect(page.locator('canvas')).toHaveCount(1);
  113 |   expect((await page.evaluate(() => window.__CODEVERSE__))?.z).toBeCloseTo(
  114 |     SPAWN.z,
  115 |   );
  116 |   await page.setViewportSize({ width: 960, height: 600 });
  117 |   await page.screenshot({
  118 |     timeout: 120_000,
  119 |     path: `${evidence}/playable-orbit.png`,
  120 |   });
  121 |   await fs.writeFile(
  122 |     `${evidence}/browser-playable.json`,
  123 |     JSON.stringify(
  124 |       {
  125 |         initial,
  126 |         paused,
  127 |         wall,
  128 |         road,
  129 |         boundary,
  130 |         cameraBefore,
  131 |         cameraAfter: await page.evaluate(() => window.__CODEVERSE__),
  132 |         errors,
  133 |         failed,
  134 |         environment:
  135 |           'Chromium software SwiftShader WebGL2; not laptop/GPU/FPS proof',
  136 |       },
  137 |       null,
  138 |       2,
  139 |     ) + '\n',
  140 |   );
  141 |   expect(errors).toEqual([]);
  142 |   expect(failed).toEqual([]);
  143 | });
  144 | 
```