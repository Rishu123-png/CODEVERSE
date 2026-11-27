import type { Page } from '@playwright/test';

// Software-driver readback can starve behind an actively scheduled render loop.
// Pause ONLY framebuffer readback; all input/functional assertions run live.
export async function captureFrame(
  page: Page,
  options: Parameters<Page['screenshot']>[0],
) {
  const paused = process.env.PLAYWRIGHT_SOFTWARE_RENDERING === '1';
  if (paused)
    await page.evaluate(() => {
      const engine = window.__renderScene?.getEngine();
      if (!engine) return;
      const loops = [...engine.activeRenderLoops];
      window.__resumeEvidence = () => {
        loops.forEach((loop) => engine.runRenderLoop(loop));
        delete window.__resumeEvidence;
      };
      engine.stopRenderLoop();
    });
  try {
    return await page.screenshot(options);
  } finally {
    if (paused) await page.evaluate(() => window.__resumeEvidence?.());
  }
}
declare global {
  interface Window {
    __resumeEvidence?: () => void;
  }
}
