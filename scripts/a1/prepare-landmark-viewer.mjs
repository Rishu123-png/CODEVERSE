/* global console */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { build } = await import(
  pathToFileURL(
    path.resolve('.cache/a1/tools/node_modules/esbuild/lib/main.js'),
  ).href
);
const html = await fs.readFile('scripts/a1/landmark-viewer.html', 'utf8');
const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Missing viewer module');
await build({
  stdin: {
    contents: match[1].replaceAll("'/tools/", "'./tools/"),
    resolveDir: path.resolve('.cache/a1'),
    sourcefile: 'landmark-viewer.js',
  },
  outfile: '.cache/a1/landmark-bundle.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  logLevel: 'warning',
});
await fs.writeFile(
  '.cache/a1/landmark.html',
  html.replace(
    match[0],
    '<script type="module" src="/landmark-bundle.js"></script>',
  ),
);
await fs.copyFile(
  '.cache/a1/tools/node_modules/meshoptimizer/meshopt_decoder.cjs',
  '.cache/a1/meshopt-decoder.js',
);
// The live preview should open the current labeled study, not a directory listing.
await fs.copyFile('.cache/a1/landmark.html', '.cache/a1/index.html');
await fs.mkdir('.cache/a1/runtime-generated', { recursive: true });
for (const file of ['landmark-study.glb', 'landmark-study.meshopt.glb'])
  await fs.copyFile(
    '.cache/a1-runtime/generated/' + file,
    '.cache/a1/runtime-generated/' + file,
  );
console.log('Prepared /landmark.html; serve .cache/a1 on 0.0.0.0:5181.');
