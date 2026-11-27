/* global console */
// Transparent arithmetic, NOT a GPU benchmark or HP Victus specification inference.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const veg = JSON.parse(
  await fs.readFile(
    'docs/evidence/a1-final/vegetation-inspection.json',
    'utf8',
  ),
);
const arch = JSON.parse(
  await fs.readFile('docs/evidence/a1-runtime/landmark-study.json', 'utf8'),
);
const MiB = 1024 ** 2;
const texture = [1024, 2048, 4096].map((size) => ({
  size,
  rgba8FullMipChainMiB: (size * size * 4 * 4) / 3 / MiB,
  bc7OrEtc2RgbaFullMipChainMiB: (size * size * 4) / 3 / MiB,
  notes:
    'Idealized full-chain arithmetic. RGBA8 uncompressed vs 8 bits/texel block compression; alignment/driver overhead excluded. No KTX2 encoding/device format support proven.',
}));
const geometry = veg.variants.map((v) => ({
  file: v.file,
  triangles: v.triangles,
  vertices: Object.values(v.geometry).reduce((s, g) => s + g.vertices, 0),
  estimatedRawPositionNormalUvAndU32IndexMiB:
    (Object.values(v.geometry).reduce((s, g) => s + g.vertices, 0) * 32 +
      v.triangles * 3 * 4) /
    MiB,
  measuredGlbBytes: v.bytes,
}));
const tree = veg.variants.find((v) => v.file === 'ash_medium-lod0.glb'),
  shrub = veg.variants.find((v) => v.file === 'bush_1-lod0.glb');
const constructedSubset = {
  assumption:
    '2 EZ-Tree LOD0 shade trees + 3 LOD0 shrubs + existing scalar landmark/plaza only. No flowering tree, hero, extra PBR, surroundings or reflection geometry. NOT a complete G1 scene.',
  triangles: arch.triangles + 2 * tree.triangles + 3 * shrub.triangles,
  uninstancedBaseBatches: arch.batches + 2 * 2 + 3 * 2,
  notes:
    'Triangles and per-asset meshes from generated geometry; scene sum is an estimate, not a rendered combination. Shadow/depth/reflection passes add work. Instancing/merging not implemented.',
};
assert.equal(constructedSubset.triangles, 99204);
assert.equal(constructedSubset.uninstancedBaseBatches, 37);
const publisherSubset = {
  assumption:
    'Published approximate 312K Jacaranda ×2 + 52K Shrub02 ×3 + measured construction study; not acquired source counts, not all final assets',
  approximateTriangles: 312000 * 2 + 52000 * 3 + arch.triangles,
};
const focal = 1080 / (2 * Math.tan((55 * Math.PI) / 360));
const projection = {
  assumption:
    'Pinhole upright extent centered perpendicular to view, 1080px backing height, 55deg vertical FOV. Approximation; no perceptual quality threshold or frame-time result.',
  verticalFocalPixels: focal,
  tree8mAt20mPixels: (8 / 20) * focal,
  tree8mAt40mPixels: (8 / 40) * focal,
  hero1_8mAt4mPixels: (1.8 / 4) * focal,
};
const report = {
  scope:
    'Planning arithmetic using measured source counts; NOT measured FPS, VRAM, draw calls, Windows/WebGPU or HP Victus results',
  hardware: {
    known: 'User says HP Victus',
    unknown: [
      'exact model/product number',
      'CPU',
      'integrated/discrete GPU',
      'dedicated VRAM',
      'system RAM/channel configuration',
      'GPU driver',
      'OS/browser version',
      'display/backing resolution and DPR',
      'power/thermal mode',
    ],
    decision:
      'No SKU inferred from product family; no guaranteed FPS or automatic tier selected',
  },
  texture,
  geometry,
  constructedSubset,
  publisherSubset,
  projection,
  frameTimeReference: {
    fps60Milliseconds: 1000 / 60,
    fps30Milliseconds: 1000 / 30,
    scope: 'reciprocal arithmetic, not targets passed',
  },
  criticalUnknowns: [
    'physical-GPU fill-rate for overlapping masked leaves',
    'leaf/canopy shadow cost',
    'premium glass/reflection cost',
    'texture residency/decode peak',
    'actual hero skin/motion cost',
    'CPU submission/culling/React isolation under workload',
    'Windows WebGPU and WebGL2 parity',
    'thermal sustained behavior',
  ],
  notDone: [
    'No G1 scene built',
    'No owner device benchmark',
    'No FPS derived from triangles or SwiftShader',
    'No KTX2 benefit assumed',
    'No VRAM obtained from compressed file sizes',
  ],
};
await fs.writeFile(
  'docs/evidence/a1-final/performance-risk-model.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
