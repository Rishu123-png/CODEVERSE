/* global process, console */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const { build } = await import(
  pathToFileURL(
    path.resolve('.cache/a1/tools/node_modules/esbuild/lib/main.js'),
  ).href
);
const html = await fs.readFile('scripts/a1/study-viewer.html', 'utf8');
const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Viewer module not found');
await build({
  stdin: {
    contents: match[1].replaceAll("'/tools/", "'./tools/"),
    resolveDir: path.join(root, '.cache/a1'),
    sourcefile: 'a1-study-viewer.js',
  },
  outfile: '.cache/a1/study-bundle.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  logLevel: 'warning',
});
await fs.writeFile(
  '.cache/a1/study-viewer.html',
  html.replace(
    match[0],
    '<script type="module" src="/study-bundle.js"></script>',
  ),
);
await fs.copyFile(
  '.cache/a1/tools/node_modules/meshoptimizer/meshopt_decoder.cjs',
  '.cache/a1/meshopt-decoder.js',
);
// Default route is the explicitly labeled laboratory, not a directory listing.
await fs.copyFile('.cache/a1/study-viewer.html', '.cache/a1/index.html');
console.log('Prepared isolated, bundled diagnostic viewer.');
