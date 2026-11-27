/* global Buffer, console, process */
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
const entry = process.argv[2] || 'src/game/movement.ts';
const moduleURL = (source) =>
  'data:text/javascript;base64,' +
  Buffer.from(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext },
    }).outputText,
  ).toString('base64');
let source = await fs.readFile(entry, 'utf8');
// This measurement only loads the controller and its known shared layout input.
// It needs the project's normal TypeScript dev dependency, not authoring caches.
if (source.includes("'./districtLayout'")) {
  const layout = await fs.readFile(
    path.join(path.dirname(entry), 'districtLayout.ts'),
    'utf8',
  );
  source = source.replaceAll(
    "'./districtLayout'",
    JSON.stringify(moduleURL(layout)),
  );
}
const { isBlocked, SPAWN } = await import(moduleURL(source));
const step = 0.5,
  visited = new Set(),
  queue = [[SPAWN.x, SPAWN.z]];
visited.add(`${SPAWN.x},${SPAWN.z}`);
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [
    [step, 0],
    [-step, 0],
    [0, step],
    [0, -step],
  ]) {
    const X = x + dx,
      Z = z + dz,
      k = `${X},${Z}`;
    if (!visited.has(k) && !isBlocked(X, Z)) {
      visited.add(k);
      queue.push([X, Z]);
    }
  }
}
const report = {
  entry,
  sampleSpacingMetres: step,
  reachableSamples: visited.size,
  reachableWalkableSquareMetres: visited.size * step * step,
  method:
    'Four-neighbour flood fill from spawn through collision-free 0.5m samples. Estimate of reachable controller space, not surveyed surface area; excludes blocked architecture, beds and furniture. Does not itself prove visual completeness.',
};
console.log(JSON.stringify(report, null, 2));
if (process.argv[3])
  await fs.writeFile(process.argv[3], JSON.stringify(report, null, 2) + '\n');
