/* global console, process, window */
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const folder = 'docs/evidence/g1-rendering/probes';
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
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  const logs = [];
  page.on('console', (m) => logs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => logs.push({ type: 'pageerror', text: e.stack }));
  await page.goto('http://localhost:4173/?renderer=webgpu&renderAudit=1');
  await page.waitForFunction(() => !!window.__renderScene, null, {
    timeout: 120000,
  });
  for (const mode of [
    'baseline',
    'no-shadows',
    'no-environment',
    'no-tonemapping',
    'unlit',
  ]) {
    await page.evaluate((mode) => {
      const s = window.__renderScene;
      window.__savedEnv ||= s.environmentTexture;
      s.shadowsEnabled = mode !== 'no-shadows';
      s.environmentTexture =
        mode === 'no-environment' ? null : window.__savedEnv;
      s.imageProcessingConfiguration.toneMappingEnabled =
        mode !== 'no-tonemapping';
      for (const m of s.materials) if ('unlit' in m) m.unlit = mode === 'unlit';
    }, mode);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${folder}/${mode}.png` });
    console.log(mode);
  }
  await fs.writeFile(
    `${folder}/console.json`,
    JSON.stringify(logs, null, 2) + '\n',
  );
} finally {
  await browser.close();
}
