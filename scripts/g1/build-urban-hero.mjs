/* global console */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const load = (p) =>
  import(pathToFileURL(path.resolve('.cache/a1/tools/node_modules', p)).href);
const { NodeIO } = await load('@gltf-transform/core/dist/index.js');
const { dedup, weld, prune, clearNodeParent } = await load(
  '@gltf-transform/functions/dist/index.js',
);
const sharp = (await load('sharp/dist/index.mjs')).default;
const base = '.cache/g2/',
  src = base + 'rocketbox/';
const j = JSON.parse(
  await fs.readFile(base + 'Male_Adult_04.fbx.result.gltf', 'utf8'),
);
delete j.extensionsUsed;
const resources = {
  'result.bin': new Uint8Array(
    await fs.readFile(base + 'Male_Adult_04.fbx.result.bin'),
  ),
};
for (const image of j.images) {
  const name = image.uri.split('\\').filter(Boolean).at(-1),
    a = await fs.readFile(src + name);
  const w = a.readUInt16LE(12),
    h = a.readUInt16LE(14),
    ch = a[16] / 8,
    off = 18 + a[0];
  if (a[2] !== 2) throw Error('TGA not uncompressed');
  const raw = new Uint8Array(w * h * ch);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = off + (y * w + x) * ch,
        o = ((a[17] & 32 ? y : h - 1 - y) * w + x) * ch;
      raw[o] = a[i + 2];
      raw[o + 1] = a[i + 1];
      raw[o + 2] = a[i];
      if (ch === 4) raw[o + 3] = a[i + 3];
    }
  const normal = name.includes('normal'),
    opacity = name.includes('opacity');
  const bytes = await sharp(raw, { raw: { width: w, height: h, channels: ch } })
    .resize(normal || opacity ? 1024 : 2048)
    .toFormat(
      normal || opacity ? 'png' : 'jpeg',
      normal || opacity ? {} : { quality: 90 },
    )
    .toBuffer();
  image.uri = name.replace('.tga', normal || opacity ? '.png' : '.jpg');
  resources[image.uri] = new Uint8Array(bytes);
}
for (const [i, m] of j.materials.entries()) {
  m.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
  m.pbrMetallicRoughness.roughnessFactor = i === 1 ? 0.68 : 0.88;
  if (i === 2) {
    m.alphaMode = 'MASK';
    m.alphaCutoff = 0.45;
    m.doubleSided = true;
  }
  if (m.normalTexture) m.normalTexture.scale = 0.45;
}
j.animations = [];
for (const [file, name] of [
  ['m_idle_breathe_01.max.fbx', 'Idle'],
  ['m_walk_neutral_01.max.fbx', 'Walk'],
  ['m_run_neutral_01.max.fbx', 'Run'],
]) {
  const a = JSON.parse(await fs.readFile(base + file + '.result.gltf', 'utf8')),
    raw = await fs.readFile(base + file + '.result.bin'),
    bo = j.buffers.length,
    vo = j.bufferViews.length,
    ao = j.accessors.length;
  const uri = name + '.bin';
  resources[uri] = new Uint8Array(raw);
  j.buffers.push({ ...a.buffers[0], uri });
  // Remove root horizontal travel only. FBX source Z is vertical; parent rotates into glTF Y-up.
  for (const c of a.animations[0].channels)
    if (
      a.nodes[c.target.node].name === 'Bip01' &&
      c.target.path === 'translation'
    ) {
      const ac = a.accessors[a.animations[0].samplers[c.sampler].output],
        v = a.bufferViews[ac.bufferView],
        offset = (v.byteOffset || 0) + (ac.byteOffset || 0),
        stride = v.byteStride || 12;
      const X = raw.readFloatLE(offset);
      for (let n = 0; n < ac.count; n++) {
        raw.writeFloatLE(X, offset + n * stride);
        raw.writeFloatLE(raw.readFloatLE(offset + 8), offset + n * stride + 8);
      }
      delete ac.min;
      delete ac.max;
    }
  resources[uri] = new Uint8Array(raw);
  j.bufferViews.push(
    ...a.bufferViews.map((v) => ({ ...v, buffer: v.buffer + bo })),
  );
  j.accessors.push(
    ...a.accessors.map((v) => ({ ...v, bufferView: v.bufferView + vo })),
  );
  const anim = a.animations[0];
  j.animations.push({
    name,
    samplers: anim.samplers.map((s) => ({
      ...s,
      input: s.input + ao,
      output: s.output + ao,
    })),
    channels: anim.channels
      .filter((c) =>
        j.nodes.some((n) => n.name === a.nodes[c.target.node].name),
      )
      .map((c) => ({
        ...c,
        target: {
          ...c.target,
          node: j.nodes.findIndex(
            (n) => n.name === a.nodes[c.target.node].name,
          ),
        },
      })),
  });
}

const io = new NodeIO(),
  d = await io.readJSON({ json: j, resources });
// Assimp FBX exported root animation is the combined local transform; collapse
// its static pivot wrappers to avoid applying the root translation/rotation twice.
for (const n of d.getRoot().listNodes())
  if (n.getName() === 'Bip01' || n.getSkin()) clearNodeParent(n);
for (const n of d.getRoot().listNodes()) {
  n.setTranslation(n.getTranslation().map((v) => v * 0.01));
  if (n.getSkin())
    n.setMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}
const scaled = new Set();
const scaleAccessor = (a, mat = false) => {
  if (scaled.has(a)) return;
  scaled.add(a);
  const v = a.getArray();
  for (let i = 0; i < v.length; i++)
    if (!mat || i % 16 === 12 || i % 16 === 13 || i % 16 === 14) v[i] *= 0.01;
};
for (const mesh of d.getRoot().listMeshes())
  for (const p of mesh.listPrimitives())
    scaleAccessor(p.getAttribute('POSITION'));
for (const skin of d.getRoot().listSkins())
  scaleAccessor(skin.getInverseBindMatrices(), true);
for (const a of d.getRoot().listAnimations())
  for (const c of a.listChannels())
    if (c.getTargetPath() === 'translation')
      scaleAccessor(c.getSampler().getOutput());
await d.transform(dedup(), weld(), prune());
const { tangentsFor } = await import('./geometry-utils.mjs');
for (const mesh of d.getRoot().listMeshes())
  for (const p of mesh.listPrimitives()) {
    const P = p.getAttribute('POSITION'),
      N = p.getAttribute('NORMAL'),
      U = p.getAttribute('TEXCOORD_0'),
      I = p.getIndices();
    if (P && N && U && I)
      p.setAttribute(
        'TANGENT',
        d
          .createAccessor('portable tangent basis')
          .setType('VEC4')
          .setArray(
            tangentsFor(P.getArray(), N.getArray(), U.getArray(), I.getArray()),
          )
          .setBuffer(d.getRoot().listBuffers()[0]),
      );
  }
const buffers = d.getRoot().listBuffers();
for (const a of d.getRoot().listAccessors()) a.setBuffer(buffers[0]);
for (const b of buffers.slice(1)) b.dispose();

d.getRoot().getAsset().copyright =
  'Microsoft Rocketbox Male Adult 04 and compatible motion MIT. CodeVerse glTF conversion, in-place extraction and PBR adaptation.';
const out = await io.writeBinary(d);
await fs.writeFile('public/assets/g1/hero-urban.glb', out);
const validator = await load('gltf-validator/index.js'),
  v = await validator.validateBytes(out, {
    uri: 'hero-rocketbox.glb',
    writeTimestamp: false,
  });
await fs.writeFile(
  'docs/evidence/g1-graphics/hero-validation.json',
  JSON.stringify(v, null, 2),
);
console.log(
  'Hero',
  out.length,
  'bytes',
  v.issues.numErrors,
  'errors',
  v.issues.numWarnings,
  'warnings',
);
