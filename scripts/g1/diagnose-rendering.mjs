/* global console, process, window, document, navigator, WebGL2RenderingContext */
import { chromium, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';
const folder =
  process.env.RENDER_EVIDENCE || 'docs/evidence/g1-rendering/after';
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--enable-unsafe-webgpu',
    ...(process.env.RENDER_VULKAN
      ? [
          '--enable-features=Vulkan',
          '--use-vulkan=swiftshader',
          '--disable-vulkan-surface',
        ]
      : []),
  ],
  env: process.env,
});
try {
  for (const mode of (
    process.env.RENDER_MODES ||
    'production-webgl2,development-webgl2,production-webgpu'
  ).split(',')) {
    const [build, backend] = mode.split('-');
    const logs = [],
      errors = [],
      failed = [],
      httpErrors = [];
    const page = await browser.newPage({
      viewport: {
        width: Number(process.env.RENDER_WIDTH || 960),
        height: Number(process.env.RENDER_HEIGHT || 600),
      },
    });
    page.on('crash', () => {
      fs.writeFile(
        `${folder}/${mode}-crash.json`,
        JSON.stringify({ logs, errors, failed, httpErrors }, null, 2),
      );
      console.log(mode, 'CRASH', JSON.stringify(logs));
    });
    page.on('console', (m) => logs.push({ type: m.type(), text: m.text() }));
    page.on('pageerror', (e) => errors.push(e.stack || e.message));
    page.on('requestfailed', (r) =>
      failed.push({ url: r.url(), error: r.failure() }),
    );
    page.on('response', (r) => {
      if (r.status() >= 400)
        httpErrors.push({ url: r.url(), status: r.status() });
    });
    await page.addInitScript(() => {
      window.__shaderFailures = [];
      const proto = WebGL2RenderingContext.prototype;
      const compile = proto.compileShader;
      proto.compileShader = function (shader) {
        compile.call(this, shader);
        if (!this.getShaderParameter(shader, this.COMPILE_STATUS))
          window.__shaderFailures.push(this.getShaderInfoLog(shader));
      };
    });
    const url = `http://localhost:${build === 'production' ? 4173 : 5173}/?renderer=${backend}&renderAudit=1`;
    await page.goto(url);
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="active-backend"]') ||
        document.querySelector('[role="alert"]'),
      null,
      { timeout: 120000 },
    );
    // Inspect ONE actual rendered frame, never substitute a DOM-ready check.
    await page.waitForFunction(() => window.__renderScene?.isReady(), null, {
      timeout: 120000,
    });
    await page.waitForTimeout(2000);
    if (process.env.RENDER_STATIC_CAPTURE) {
      // Optional software-readback diagnostic: stop scheduling NEW game frames
      // while the already-rendered canvas is read. Materials/resolution/shadows
      // stay unchanged. Dynamic gameplay is tested separately, not claimed here.
      await page.evaluate(() =>
        window.__renderScene.getEngine().stopRenderLoop(),
      );
    }
    const image = await page.screenshot({
      timeout: 120000,
      path: `${folder}/${mode}.png`,
    });
    const state = await page.evaluate(async () => ({
      backend: document.querySelector('[data-testid="active-backend"]')
        ?.textContent,
      error: document.querySelector('[role="alert"]')?.textContent,
      shaders: window.__shaderFailures,
      adapter: navigator.gpu
        ? await navigator.gpu.requestAdapter().then((a) =>
            a
              ? {
                  ...a.info.toJSON?.(),
                  vendor: a.info.vendor,
                  architecture: a.info.architecture,
                  device: a.info.device,
                  description: a.info.description,
                }
              : null,
          )
        : null,
      render: window.__renderAudit?.(),
      canvas: !!document.querySelector('canvas'),
      canvasCount: document.querySelectorAll('canvas').length,
      developmentTelemetry: !!window.__CODEVERSE__,
    }));
    const png = PNG.sync.read(image);
    let count = 0,
      dark = 0,
      sum = 0;
    // Central paving, excluding player/UI. This caught the reproduced black output.
    for (
      let y = Math.floor(png.height * 0.66);
      y < Math.floor(png.height * 0.77);
      y++
    )
      for (
        let x = Math.floor(png.width * 0.2);
        x < Math.floor(png.width * 0.8);
        x++
      ) {
        const i = (y * png.width + x) * 4,
          l =
            0.2126 * png.data[i] +
            0.7152 * png.data[i + 1] +
            0.0722 * png.data[i + 2];
        sum += l;
        dark += Number(l < 16);
        count++;
      }
    const pavingPixels = {
      meanLuminance: sum / count,
      blackFraction: dark / count,
    };
    if (
      (process.env.RENDER_VIEWS || process.env.RENDER_RESIZE) &&
      mode === 'production-webgpu'
    ) {
      for (const view of process.env.RENDER_VIEWS
        ? ['overview', 'character', 'vegetation']
        : []) {
        await page.evaluate((view) => {
          const s = window.__renderScene,
            c = s.activeCamera,
            V = c.target.constructor;
          c.upperRadiusLimit = 90;
          window.__auditCameraObserver = s.onBeforeRenderObservable.add(() => {
            c.setTarget(
              view === 'vegetation'
                ? new V(17.5, 2.4, 3)
                : view === 'overview'
                  ? new V(0, 5, 2)
                  : new V(0, 1, 10),
            );
            c.setPosition(
              view === 'vegetation'
                ? new V(21, 3.8, 10)
                : view === 'overview'
                  ? new V(35, 28, 48)
                  : new V(0.8, 1.8, 6),
            );
          });
        }, view);
        await page.waitForTimeout(1500);
        await page.screenshot({
          timeout: 120000,
          path: `${folder}/${mode}-${view}.png`,
        });
        await page.evaluate(() =>
          window.__renderScene.onBeforeRenderObservable.remove(
            window.__auditCameraObserver,
          ),
        );
      }
      await page.reload();
      await page.waitForFunction(() => window.__renderScene?.isReady(), null, {
        timeout: 120000,
      });
      await page.setViewportSize({ width: 1000, height: 640 });
      await page.waitForTimeout(1500);
      await page.screenshot({
        timeout: 120000,
        path: `${folder}/${mode}-reload-resize.png`,
      });
      state.reloadAudit = await page.evaluate(() => window.__renderAudit());
    }
    const report = {
      pavingPixels,
      capture: process.env.RENDER_STATIC_CAPTURE
        ? 'Scheduling paused only for canvas readback; dynamic behavior tested separately'
        : 'Live render loop',
      url,
      browser: await browser.version(),
      state,
      logs,
      errors,
      failed,
      httpErrors,
      environment:
        'Linux Chromium software SwiftShader; not owner laptop or physical GPU',
    };
    await fs.writeFile(
      `${folder}/${mode}.json`,
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log(
      mode,
      JSON.stringify({
        backend: state.backend,
        pavingPixels,
        logs,
        errors,
        failed,
        httpErrors,
      }),
    );
    if (process.env.RENDER_ASSERT) {
      expect(state.error).toBeUndefined();
      expect(state.canvasCount).toBe(1);
      expect(state.developmentTelemetry).toBe(build !== 'production');
      expect(state.backend).toBe(backend === 'webgl2' ? 'WebGL2' : 'WebGPU');
      expect(pavingPixels.meanLuminance).toBeGreaterThan(70);
      expect(pavingPixels.blackFraction).toBeLessThan(0.05);
      expect(errors).toEqual([]);
      expect(failed).toEqual([]);
      expect(httpErrors).toEqual([]);
      expect(state.shaders).toEqual([]);
      expect(
        logs.filter(
          (l) =>
            l.type === 'error' ||
            /GPUValidationError|uncaptured error|Destroyed texture/i.test(
              l.text,
            ),
        ),
      ).toEqual([]);
      if (state.reloadAudit) {
        expect(state.reloadAudit.ready).toBe(true);
        expect(state.reloadAudit.textures.filter((t) => !t.ready)).toEqual([]);
      }
      const audit = state.render;
      expect(audit.textures.filter((t) => !t.ready)).toEqual([]);
      expect(
        audit.meshes.filter(
          (m) => !m.normals || !m.ready || m.effectError?.length,
        ),
      ).toEqual([]);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
