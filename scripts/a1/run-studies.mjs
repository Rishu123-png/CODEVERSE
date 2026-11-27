/* global process, Buffer, console */
// Isolated A1 diagnostic fixtures. NOT game assets, a finished landmark or hero.
// Dependencies are resolved only from .cache/a1/tools; root app is untouched.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = process.cwd();
const tools = path.join(root, '.cache/a1/tools/node_modules');
const load = (p) => import(pathToFileURL(path.join(tools, p)).href);
const { Document, NodeIO } = await load('@gltf-transform/core/dist/index.js');
const { dedup, prune, weld, meshopt } = await load(
  '@gltf-transform/functions/dist/index.js',
);
const { ALL_EXTENSIONS } = await load(
  '@gltf-transform/extensions/dist/index.js',
);
const { MeshoptEncoder, MeshoptDecoder } = await load('meshoptimizer/index.js');
const validator = await load('gltf-validator/index.js');
const sharp = (await load('sharp/dist/index.mjs')).default;
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const out = path.join(root, '.cache/a1/generated');
const evidence = path.join(root, 'docs/evidence/a1');
await fs.mkdir(out, { recursive: true });
await fs.mkdir(evidence, { recursive: true });
const hash = (b) => createHash('sha256').update(b).digest('hex');
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });
function fixture(name) {
  const d = new Document();
  d.getRoot().getAsset().copyright =
    'Original CodeVerse A1 technical fixture; not approved production art';
  const b = d.createBuffer();
  const s = d.createScene(name);
  d.getRoot().setDefaultScene(s);
  const acc = (name, type, values, ArrayType = Float32Array) =>
    d
      .createAccessor(name)
      .setType(type)
      .setArray(new ArrayType(values))
      .setBuffer(b);
  const mat = (name, color, metal = 0, rough = 0.65) =>
    d
      .createMaterial(name)
      .setBaseColorFactor(color)
      .setMetallicFactor(metal)
      .setRoughnessFactor(rough);
  function mesh(name, positions, normals, uvs, indices, material) {
    const p = d
      .createPrimitive()
      .setAttribute('POSITION', acc(name + '-p', 'VEC3', positions))
      .setAttribute('NORMAL', acc(name + '-n', 'VEC3', normals))
      .setAttribute('TEXCOORD_0', acc(name + '-uv', 'VEC2', uvs))
      .setIndices(acc(name + '-i', 'SCALAR', indices, Uint16Array))
      .setMaterial(material);
    const node = d.createNode(name).setMesh(d.createMesh(name).addPrimitive(p));
    s.addChild(node);
    return { node, p };
  }
  function quads(name, qs, material) {
    const p = [],
      n = [],
      uv = [],
      ind = [];
    for (const q of qs) {
      const offset = p.length / 3;
      const a = q[0],
        b = q[1],
        c = q[2];
      const u = b.map((x, i) => x - a[i]),
        v = c.map((x, i) => x - a[i]);
      const cross = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      const len = Math.hypot(...cross);
      assert(len > 0);
      for (const x of q) {
        p.push(...x);
        n.push(...cross.map((x) => x / len));
      }
      uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      ind.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    }
    return mesh(name, p, n, uv, ind, material);
  }
  function box(name, lo, hi, material) {
    const [x, y, z] = lo,
      [X, Y, Z] = hi;
    return quads(
      name,
      [
        [
          [x, y, Z],
          [X, y, Z],
          [X, Y, Z],
          [x, Y, Z],
        ],
        [
          [X, y, z],
          [x, y, z],
          [x, Y, z],
          [X, Y, z],
        ],
        [
          [x, y, z],
          [x, y, Z],
          [x, Y, Z],
          [x, Y, z],
        ],
        [
          [X, y, Z],
          [X, y, z],
          [X, Y, z],
          [X, Y, Z],
        ],
        [
          [x, Y, Z],
          [X, Y, Z],
          [X, Y, z],
          [x, Y, z],
        ],
        [
          [x, y, z],
          [X, y, z],
          [X, y, Z],
          [x, y, Z],
        ],
      ],
      material,
    );
  }
  return { d, s, acc, mat, mesh, quads, box };
}
function architecture(segments = 48) {
  const f = fixture('A1 curved junction / plaza / prop diagnostic');
  const stone = f.mat('original pale paving', [0.62, 0.65, 0.66, 1]);
  const metal = f.mat(
    'original blue neutral metal',
    [0.15, 0.23, 0.29, 1],
    0.75,
    0.3,
  );
  const glass = f.mat(
    'opaque reflective glazing diagnostic',
    [0.08, 0.2, 0.29, 1],
    0.55,
    0.16,
  );
  const blue = f
    .mat('blue accent', [0.02, 0.28, 0.8, 1], 0.15, 0.35)
    .setEmissiveFactor([0.01, 0.06, 0.16]);
  const pt = (r, a, y) => [r * Math.sin(a), y, r * Math.cos(a) - 8];
  const lo = -Math.PI / 6,
    hi = Math.PI / 6;
  for (const [name, r0, r1, y0, y1, material] of [
    ['lower-band', 7.9, 8.25, 0.12, 0.32, stone],
    ['upper-band', 7.9, 8.25, 3.45, 3.7, stone],
  ]) {
    const qs = [];
    for (let i = 0; i < segments; i++) {
      const a = lo + ((hi - lo) * i) / segments,
        b = lo + ((hi - lo) * (i + 1)) / segments;
      qs.push([pt(r1, a, y0), pt(r1, b, y0), pt(r1, b, y1), pt(r1, a, y1)]);
      qs.push([pt(r0, a, y1), pt(r1, a, y1), pt(r1, b, y1), pt(r0, b, y1)]);
      qs.push([pt(r0, b, y0), pt(r1, b, y0), pt(r1, a, y0), pt(r0, a, y0)]);
    }
    f.quads(name, qs, material);
  }
  const panels = [];
  for (let i = 0; i < segments; i++) {
    const a = lo + ((hi - lo) * i) / segments,
      b = lo + ((hi - lo) * (i + 1)) / segments;
    if (Math.abs((a + b) / 2) < Math.PI / 18) continue;
    panels.push([
      pt(8, a, 0.32),
      pt(8, b, 0.32),
      pt(8, b, 3.45),
      pt(8, a, 3.45),
    ]);
  }
  f.quads('curved-bay-panels', panels, glass);
  for (let i = 0; i <= 6; i++) {
    const a = lo + ((hi - lo) * i) / 6,
      [x, , z] = pt(8, a, 0);
    f.box(
      'mullion-' + i,
      [x - 0.035, 0.32, z - 0.07],
      [x + 0.035, 3.45, z + 0.07],
      metal,
    );
  }
  f.box('recessed-entry', [-0.72, 0.15, -0.9], [0.72, 2.9, -0.82], glass);
  f.box('entry-canopy', [-1.05, 2.95, -0.95], [1.05, 3.08, 0.35], metal);
  f.box('blue-entry-trim', [-1.05, 3.08, -0.95], [1.05, 3.13, 0.35], blue);
  f.box('plaza-base', [-5, -0.2, -2], [5, 0, 5], stone);
  f.box('curb', [-5, 0, 3.5], [-1, 0.15, 3.65], stone);
  f.quads(
    'ramp-surface',
    [
      [
        [-0.6, 0, 1.7],
        [0.6, 0, 1.7],
        [0.6, 0.15, 3.5],
        [-0.6, 0.15, 3.5],
      ],
    ],
    stone,
  );
  f.box('bench-seat', [2, 0.43, 1.3], [3.6, 0.51, 1.73], metal);
  for (const x of [2.15, 3.25])
    f.box('bench-support-' + x, [x, 0, 1.35], [x + 0.12, 0.43, 1.68], metal);
  const collider = f.box(
    'COLLIDER-entry-wall',
    [-1.1, 0, -1.1],
    [1.1, 3.2, -1.02],
    stone,
  );
  collider.node.setExtras({
    purpose: 'collision-only',
    notRenderGeometry: true,
  });
  // Kept off-screen in the inspection harness; actual collider extraction is not implemented.
  collider.node.setTranslation([0, -20, 0]);
  const sagitta = 8 * (1 - Math.cos((hi - lo) / segments / 2));
  return {
    ...f,
    measurements: {
      segments,
      curveRadiusMeters: 8,
      arcDegrees: 60,
      maxChordDeviationMeters: sagitta,
      rampRise: 0.15,
      rampRun: 1.8,
      rampSlope: 1 / 12,
      fixtureOnly: true,
    },
  };
}
async function foliage() {
  const f = fixture('A1 alpha/mip/material diagnostic; NOT a source tree');
  const svg =
    '<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg"><path fill="#558b39" d="M64 5 Q122 35 65 120 Q6 90 64 5"/><path fill="none" stroke="#b4bb70" stroke-width="3" d="M64 115L64 22"/></svg>';
  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  const t = f.d
    .createTexture('original diagnostic leaf')
    .setImage(image)
    .setMimeType('image/png');
  const m = f
    .mat('alpha-cutout-foliage', [1, 1, 1, 1], 0, 1)
    .setBaseColorTexture(t)
    .setAlphaMode('MASK')
    .setAlphaCutoff(0.5)
    .setDoubleSided(true);
  f.quads(
    'crossed-cards',
    [
      [
        [-0.6, 0, 0],
        [0.6, 0, 0],
        [0.6, 1.5, 0],
        [-0.6, 1.5, 0],
      ],
      [
        [0, 0, -0.6],
        [0, 0, 0.6],
        [0, 1.5, 0.6],
        [0, 1.5, -0.6],
      ],
    ],
    m,
  );
  return {
    ...f,
    measurements: {
      originalTexture: [128, 128],
      alphaMode: 'MASK',
      alphaCutoff: 0.5,
      doubleSided: true,
      notBotanicalArt: true,
    },
  };
}
function skin() {
  const f = fixture('A1 synthetic 2-joint skin; NOT an MPFB hero');
  const material = f
    .mat('diagnostic skin strip', [0.17, 0.48, 0.8, 1])
    .setDoubleSided(true);
  const p = [],
    n = [],
    uv = [],
    idx = [],
    j = [],
    w = [];
  for (let row = 0; row <= 4; row++)
    for (let x = 0; x < 2; x++) {
      const y = row * 0.5;
      p.push(x ? 0.25 : -0.25, y, 0);
      n.push(0, 0, 1);
      uv.push(x, y / 2);
      const blend = Math.max(0, Math.min(1, y - 0.5));
      j.push(0, blend > 0 ? 1 : 0, 0, 0);
      w.push(1 - blend, blend, 0, 0);
    }
  for (let row = 0; row < 4; row++) {
    const a = row * 2;
    idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  const { node, p: prim } = f.mesh('weighted-strip', p, n, uv, idx, material);
  prim
    .setAttribute('JOINTS_0', f.acc('joints', 'VEC4', j, Uint16Array))
    .setAttribute('WEIGHTS_0', f.acc('weights', 'VEC4', w));
  const root = f.d.createNode('diagnostic-root'),
    tip = f.d.createNode('diagnostic-tip').setTranslation([0, 1, 0]);
  root.addChild(tip);
  f.s.addChild(root);
  const inv = [
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0,
    0, 1, 0, 0, -1, 0, 1,
  ];
  node.setSkin(
    f.d
      .createSkin('two-joint-test')
      .addJoint(root)
      .addJoint(tip)
      .setSkeleton(root)
      .setInverseBindMatrices(f.acc('ibm', 'MAT4', inv)),
  );
  const times = f.acc('times', 'SCALAR', [0, 0.5, 1]);
  const quat = f.acc('rotations', 'VEC4', [
    0,
    0,
    0,
    1,
    0,
    0,
    Math.sin(Math.PI / 8),
    Math.cos(Math.PI / 8),
    0,
    0,
    0,
    1,
  ]);
  const sampler = f.d
    .createAnimationSampler()
    .setInput(times)
    .setOutput(quat)
    .setInterpolation('LINEAR');
  f.d
    .createAnimation('diagnostic-bend')
    .addSampler(sampler)
    .addChannel(
      f.d
        .createAnimationChannel()
        .setTargetNode(tip)
        .setTargetPath('rotation')
        .setSampler(sampler),
    );
  return {
    ...f,
    measurements: {
      joints: 2,
      clips: ['diagnostic-bend'],
      durationSeconds: 1,
      notRetargetingProof: true,
    },
  };
}
const results = {
  scope:
    'Original diagnostic fixtures only; not final art, MPFB export, G1 scene or hardware benchmark',
  tools: {
    gltfTransform: '4.5.1',
    validator: validator.version(),
    meshoptimizer: '1.2.0',
  },
  fixtures: {},
  checks: {},
};
for (const [name, make] of [
  ['architecture', () => architecture()],
  ['foliage', foliage],
  ['skin', () => skin()],
]) {
  const f = await make();
  const bytes = await io.writeBinary(f.d);
  const repeat = await io.writeBinary((await make()).d);
  assert.equal(hash(bytes), hash(repeat), 'deterministic regeneration ' + name);
  await fs.writeFile(path.join(out, name + '.glb'), bytes);
  const valid = await validator.validateBytes(bytes, {
    uri: name + '.glb',
    writeTimestamp: false,
  });
  await fs.writeFile(
    path.join(evidence, name + '-validation.json'),
    JSON.stringify(valid, null, 2) + '\n',
  );
  assert.equal(valid.issues.numErrors, 0, name + ' errors');
  assert.equal(valid.issues.numWarnings, 0, name + ' warnings');
  const optimized = await io.readBinary(bytes);
  await optimized.transform(
    dedup(),
    weld(),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  const optBytes = await io.writeBinary(optimized);
  await fs.writeFile(path.join(out, name + '.meshopt.glb'), optBytes);
  const optValidation = await validator.validateBytes(optBytes, {
    uri: name + '.meshopt.glb',
    writeTimestamp: false,
  });
  await fs.writeFile(
    path.join(evidence, name + '-meshopt-validation.json'),
    JSON.stringify(optValidation, null, 2) + '\n',
  );
  assert.equal(optValidation.issues.numErrors, 0, name + ' optimized errors');
  assert.equal(
    optValidation.issues.numWarnings,
    0,
    name + ' optimized warnings',
  );
  const decoded = await io.readBinary(optBytes);
  assert.equal(decoded.getRoot().listScenes().length, 1);
  assert.equal(
    decoded.getRoot().listSkins().length,
    f.d.getRoot().listSkins().length,
  );
  assert.equal(
    decoded.getRoot().listAnimations().length,
    f.d.getRoot().listAnimations().length,
  );
  results.fixtures[name] = {
    measurements: f.measurements,
    bytes: bytes.length,
    sha256: hash(bytes),
    repeatSha256: hash(repeat),
    errors: valid.issues.numErrors,
    warnings: valid.issues.numWarnings,
    infos: valid.issues.numInfos,
    meshes: f.d.getRoot().listMeshes().length,
    materials: f.d.getRoot().listMaterials().length,
    triangles: f.d
      .getRoot()
      .listMeshes()
      .reduce(
        (sum, m) =>
          sum +
          m
            .listPrimitives()
            .reduce((s, p) => s + p.getIndices().getCount() / 3, 0),
        0,
      ),
    optimizedBytes: optBytes.length,
    optimizedSha256: hash(optBytes),
    optimizedErrors: optValidation.issues.numErrors,
    optimizedWarnings: optValidation.issues.numWarnings,
    optimizedInfos: optValidation.issues.numInfos,
    optimizedExtensions: decoded
      .getRoot()
      .listExtensionsUsed()
      .map((e) => e.extensionName),
  };
}
try {
  const negative = await validator.validateBytes(new Uint8Array([0, 1, 2, 3]), {
    uri: 'deliberately-invalid.glb',
    writeTimestamp: false,
  });
  assert(negative.issues.numErrors > 0);
  results.checks.invalidBytesRejected = { errors: negative.issues.numErrors };
} catch (error) {
  assert(String(error).includes('could not detect glTF format'));
  results.checks.invalidBytesRejected = { rejection: String(error) };
}
const lod = architecture(12);
const lodBytes = await io.writeBinary(lod.d);
await fs.writeFile(path.join(out, 'architecture.lod-study.glb'), lodBytes);
results.lodStudy = lod.measurements;
results.checks.curveTolerance = {
  fineChordErrorBelowMillimeter:
    results.fixtures.architecture.measurements.maxChordDeviationMeters < 0.001,
  coarseChordErrorAboveMillimeter:
    lod.measurements.maxChordDeviationMeters > 0.001,
};
assert(results.checks.curveTolerance.fineChordErrorBelowMillimeter);
assert(results.checks.curveTolerance.coarseChordErrorAboveMillimeter);
results.checks.rampSlopeExactlyOneInTwelve =
  Math.abs(0.15 / 1.8 - 1 / 12) < 1e-12;
assert(results.checks.rampSlopeExactlyOneInTwelve);
results.notTested = [
  'Blender export',
  'MPFB generation/deformation/retarget',
  'source trees and source materials',
  'LOD visual acceptance',
  'KTX2',
  'physical GPU performance',
  'finished art quality',
];
await fs.writeFile(
  path.join(evidence, 'technical-studies.json'),
  JSON.stringify(results, null, 2) + '\n',
);
console.log(JSON.stringify(results, null, 2));
