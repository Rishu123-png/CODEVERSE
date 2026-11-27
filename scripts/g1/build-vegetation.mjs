/* global console */
// Refined original authored presets using already-audited MIT EZ-Tree source/leaf bytes.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root =
  '.cache/a1-final/sources/ez-tree-dcf309bd86bd521083d9c70f01f2de45fdc7c457';
const load = (p) =>
  import(pathToFileURL(path.resolve('.cache/a1/tools/node_modules', p)).href);
const { Tree } = await import(
  pathToFileURL(path.resolve('.cache/a1-final/tree-node.mjs')).href
);
const { Document, NodeIO } = await load('@gltf-transform/core/dist/index.js');
const validator = await load('gltf-validator/index.js');
const sharp = (await load('sharp/dist/index.mjs')).default;
const sourceImage = await fs.readFile(
  '.cache/a1-final/sources/ez-tree-npm/package/src/lib/assets/leaves/ash_color.png',
);
const { data: leafPixels, info } = await sharp(sourceImage)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
for (let i = 0; i < leafPixels.length; i += 4) {
  const shade =
    0.65 +
    (0.35 * (leafPixels[i] + leafPixels[i + 1] + leafPixels[i + 2])) / 765;
  leafPixels[i] = 237 * shade;
  leafPixels[i + 1] = 143 * shade;
  leafPixels[i + 2] = 177 * shade;
}
const pink = await sharp(leafPixels, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toBuffer();
const results = [];
for (const [name, preset, height, seed] of [
  ['canopy', 'ash_medium', 7.5, 33021],
  ['blossom', 'ash_medium', 5.8, 67211],
  ['underplanting', 'bush_1', 1.05, 311],
]) {
  const cfg = JSON.parse(
    await fs.readFile(`${root}/src/lib/presets/${preset}.json`, 'utf8'),
  );
  cfg.seed = seed;
  cfg.bark.textured = false;
  if (name !== 'underplanting') {
    cfg.branch.children = { 0: 9, 1: 5, 2: 3 };
    cfg.branch.start[1] = 0.5;
    cfg.branch.length[1] *= 1.05;
    cfg.branch.angle[1] = 62;
    cfg.leaves.count = name === 'blossom' ? 18 : 22;
    cfg.leaves.size = name === 'blossom' ? 4.3 : 4.2;
    cfg.leaves.start = 0.18;
    cfg.leaves.sizeVariance = 0.32;
  } else {
    cfg.branch.levels = 2;
    cfg.branch.children = { 0: 7, 1: 4, 2: 3 };
    cfg.leaves.count = 14;
    cfg.leaves.size = 4.2;
    cfg.leaves.sizeVariance = 0.3;
  }
  const tree = new Tree();
  tree.loadFromJson(cfg);
  const geometry = tree.createGeometry({
    sectionStride: 1,
    segmentFactor: 0.8,
    leafStride: 2,
  });
  let min = Infinity,
    max = -Infinity;
  for (const g of Object.values(geometry)) {
    const a = g.getAttribute('position').array;
    for (let i = 1; i < a.length; i += 3) {
      min = Math.min(min, a[i]);
      max = Math.max(max, a[i]);
    }
  }
  const scale = height / (max - min),
    d = new Document(),
    buf = d.createBuffer(),
    s = d.createScene('CodeVerse ' + name + ' authored botanical variation');
  d.getRoot().setDefaultScene(s);
  d.getRoot().getAsset().copyright =
    'EZ-Tree and leaf source © 2024 Daniel Greenheck MIT. Original CodeVerse preset, bark texture and modified blossom colour.';
  const texture = d
    .createTexture(
      name === 'blossom'
        ? 'MIT ash cutout modified pink'
        : 'MIT ash source cutout',
    )
    .setImage(name === 'blossom' ? pink : sourceImage)
    .setMimeType('image/png');
  const leaves = d
    .createMaterial(name + ' foliage cutout')
    .setBaseColorTexture(texture)
    .setDoubleSided(true)
    .setAlphaMode('MASK')
    .setAlphaCutoff(0.4)
    .setRoughnessFactor(0.82)
    .setMetallicFactor(0);
  const barkTex = d
    .createTexture('original generated bark')
    .setImage(await fs.readFile('public/assets/g1/v2-bark-color.jpg'))
    .setMimeType('image/jpeg');
  const bark = d
    .createMaterial('original textured bark')
    .setBaseColorTexture(barkTex)
    .setRoughnessFactor(0.96)
    .setMetallicFactor(0);
  const acc = (n, t, a) =>
    d.createAccessor(n).setType(t).setArray(a).setBuffer(buf);
  let tris = 0;
  for (const [part, g] of Object.entries(geometry)) {
    const p = new Float32Array(g.getAttribute('position').array);
    for (let i = 0; i < p.length; i += 3) {
      p[i] *= scale;
      p[i + 1] = (p[i + 1] - min) * scale;
      p[i + 2] *= scale;
    }
    const indices = new Uint32Array(g.index.array);
    tris += indices.length / 3;
    const primitive = d
      .createPrimitive()
      .setAttribute('POSITION', acc('position', 'VEC3', p))
      .setAttribute(
        'NORMAL',
        acc('normal', 'VEC3', new Float32Array(g.getAttribute('normal').array)),
      )
      .setAttribute(
        'TEXCOORD_0',
        acc('uv', 'VEC2', new Float32Array(g.getAttribute('uv').array)),
      )
      .setIndices(acc('index', 'SCALAR', indices))
      .setMaterial(part === 'leaves' ? leaves : bark);
    s.addChild(
      d.createNode(part).setMesh(d.createMesh(part).addPrimitive(primitive)),
    );
    g.dispose();
  }
  const bytes = await new NodeIO().writeBinary(d);
  await fs.writeFile(`public/assets/g1/${name}-v2.glb`, bytes);
  const v = await validator.validateBytes(bytes, {
    uri: name + '.glb',
    writeTimestamp: false,
  });
  assert.equal(v.issues.numErrors, 0);
  results.push({
    name,
    bytes: bytes.length,
    triangles: tris,
    validationErrors: v.issues.numErrors,
    validationWarnings: v.issues.numWarnings,
    config: cfg,
  });
  console.log(name, bytes.length, tris);
}
await fs.writeFile(
  'docs/evidence/g1-visual/vegetation-build.json',
  JSON.stringify(results, null, 2) + '\n',
);
