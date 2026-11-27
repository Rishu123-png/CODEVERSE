/* global console */
import fs from 'node:fs/promises';
import { tangentsFor } from './geometry-utils.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const load = (p) =>
  import(pathToFileURL(path.resolve('.cache/a1/tools/node_modules', p)).href);
const { Document, NodeIO } = await load('@gltf-transform/core/dist/index.js');
const validator = await load('gltf-validator/index.js');
const raw = JSON.parse(
  await fs.readFile('.cache/g1/character-source.json', 'utf8'),
);
const d = new Document(),
  buf = d.createBuffer(),
  scene = d.createScene('CodeVerse original fixed hero early iteration');
d.getRoot().setDefaultScene(scene);
d.getRoot().getAsset().copyright =
  'MakeHuman core graphics CC0; original CodeVerse garment finishing, accessories and motion. Not Blender/MPFB output.';
const acc = (name, type, array) =>
  d.createAccessor(name).setType(type).setArray(array).setBuffer(buf);
const mat = (name, c, r = 0.8, metal = 0) =>
  d
    .createMaterial(name)
    .setBaseColorFactor([...c, 1])
    .setMetallicFactor(metal)
    .setRoughnessFactor(r);
const clothTexture = d
  .createTexture('original woven fabric normal')
  .setImage(await fs.readFile('public/assets/g1/v2-fabric-normal.png'))
  .setMimeType('image/png');
const skinmat = mat('skin warm neutral', [0.5, 0.29, 0.19]),
  jacket = mat('original midnight jacket', [0.035, 0.065, 0.115]),
  shirt = mat('original ivory shirt', [0.83, 0.84, 0.8]),
  pants = mat('original graphite cargo', [0.055, 0.067, 0.083]),
  shoes = mat('original blue sneakers', [0.025, 0.17, 0.48], 0.5),
  sole = mat('sneaker soles', [0.8, 0.85, 0.89]),
  blue = mat(
    'original electric blue seam',
    [0.02, 0.27, 0.8],
    0.4,
    0.2,
  ).setEmissiveFactor([0.005, 0.04, 0.13]),
  hair = mat('original swept hair', [0.024, 0.017, 0.014]),
  glass = mat('sunglass lenses', [0.009, 0.016, 0.025], 0.1, 0.5),
  frame = mat('sunglass frame', [0.05, 0.055, 0.06], 0.3, 0.65);
for (const m of [jacket, shirt, pants])
  m.setNormalTexture(clothTexture).setNormalScale(0.18);
const stitching = mat('blue tailored piping', [0.045, 0.2, 0.44], 0.65);
const boneNodes = raw.bones.map((b) => d.createNode(b.name)),
  heads = raw.bones.map((b) => b.head),
  boneIndex = Object.fromEntries(raw.bones.map((b, i) => [b.name, i]));
raw.bones.forEach((b, i) => {
  const parent = boneIndex[b.parent];
  boneNodes[i].setTranslation(
    b.head.map((v, k) => v - (parent === undefined ? 0 : heads[parent][k])),
  );
  if (parent === undefined) scene.addChild(boneNodes[i]);
  else boneNodes[parent].addChild(boneNodes[i]);
});
const bind = [];
heads.forEach((h) =>
  bind.push(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -h[0], -h[1], -h[2], 1),
);
const skin = d
  .createSkin('CodeVerse direct-source 53-bone binding; global rest axes')
  .setInverseBindMatrices(acc('inverse binds', 'MAT4', new Float32Array(bind)));
boneNodes.forEach((n) => skin.addJoint(n));
const mesh = d.createMesh(
  'fitted body, original garment shells and accessories',
);
function primitive(positions, indices, weights, material) {
  indices = indices.filter((_, i, a) => {
    const j = Math.floor(i / 3) * 3,
      A = a[j] * 3,
      B = a[j + 1] * 3,
      C = a[j + 2] * 3,
      u = [0, 1, 2].map((k) => positions[B + k] - positions[A + k]),
      v = [0, 1, 2].map((k) => positions[C + k] - positions[A + k]);
    return (
      Math.hypot(
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ) > 1e-12
    );
  });
  const uv = Float32Array.from(
    positions.flatMap((_, i) =>
      i % 3 === 0 ? [positions[i] * 8, positions[i + 1] * 8] : [],
    ),
  );
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3,
      b = indices[i + 1] * 3,
      c = indices[i + 2] * 3;
    const u = [
        positions[b] - positions[a],
        positions[b + 1] - positions[a + 1],
        positions[b + 2] - positions[a + 2],
      ],
      v = [
        positions[c] - positions[a],
        positions[c + 1] - positions[a + 1],
        positions[c + 2] - positions[a + 2],
      ],
      n = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
    for (const j of [a, b, c])
      for (let k = 0; k < 3; k++) normals[j + k] += n[k];
  }
  const sums = new Map();
  for (let i = 0; i < positions.length; i += 3) {
    const key = positions
      .slice(i, i + 3)
      .map((x) => x.toFixed(6))
      .join(',');
    const sum = sums.get(key) || [0, 0, 0];
    for (let k = 0; k < 3; k++) sum[k] += normals[i + k];
    sums.set(key, sum);
  }
  for (let i = 0; i < normals.length; i += 3) {
    const key = positions
      .slice(i, i + 3)
      .map((x) => x.toFixed(6))
      .join(',');
    const n = sums.get(key),
      len = Math.hypot(...n);
    for (let k = 0; k < 3; k++)
      normals[i + k] = len > 1e-12 ? n[k] / len : k === 1 ? 1 : 0;
  }
  const joints = new Uint16Array((positions.length / 3) * 8),
    ws = new Float32Array(joints.length);
  weights.forEach((rows, i) => {
    const sum = rows.reduce((s, r) => s + r[1], 0);
    assert(sum > 0 && rows.length <= 8);
    rows.forEach(([b, w], k) => {
      joints[i * 8 + k] = b;
      ws[i * 8 + k] = w / sum;
    });
  });
  const split = (a, offset) => {
    const result = new a.constructor(a.length / 2);
    for (let i = 0; i < a.length / 8; i++)
      result.set(a.subarray(i * 8 + offset, i * 8 + offset + 4), i * 4);
    return result;
  };
  mesh.addPrimitive(
    d
      .createPrimitive()
      .setAttribute(
        'POSITION',
        acc('positions', 'VEC3', new Float32Array(positions)),
      )
      .setAttribute('NORMAL', acc('normals', 'VEC3', normals))
      .setAttribute('TEXCOORD_0', acc('fabric coordinates', 'VEC2', uv))
      .setAttribute(
        'TANGENT',
        acc(
          'tangent basis',
          'VEC4',
          tangentsFor(positions, normals, uv, indices),
        ),
      )
      .setAttribute('JOINTS_0', acc('joints0', 'VEC4', split(joints, 0)))
      .setAttribute('WEIGHTS_0', acc('weights0', 'VEC4', split(ws, 0)))
      .setAttribute('JOINTS_1', acc('joints1', 'VEC4', split(joints, 4)))
      .setAttribute('WEIGHTS_1', acc('weights1', 'VEC4', split(ws, 4)))
      .setIndices(acc('indices', 'SCALAR', new Uint32Array(indices)))
      .setMaterial(material),
  );
}
// Fit actual shells around the anatomical source rather than a capsule proxy.
const batches = new Map();
for (const face of raw.faces) {
  const p = face.reduce(
    (a, i) => a.map((v, k) => v + raw.positions[i][k] / face.length),
    [0, 0, 0],
  );
  const [x, y] = p;
  let material = skinmat;
  if (y < 0.14) material = y < 0.045 ? sole : shoes;
  else if (y < 1.02) material = pants;
  else if (y < 1.51 && Math.abs(x) < 0.29) material = shirt;
  // Sleeve coverage follows source skin weights, not position alone.
  const armMass = face.reduce(
    (s, i) =>
      s +
      raw.weights[i].reduce(
        (a, [b, w]) => a + (raw.bones[b].name.includes('arm_') ? w : 0),
        0,
      ) /
        face.length,
    0,
  );
  // Occluded anatomical faces must not poke through the independently tailored
  // shirt/jacket (the old painted body caused jagged patches and a sculpted chest).
  if ((y > 1.012 && y < 1.525 && Math.abs(x) < 0.29) || armMass > 0.35)
    continue;
  const key = material.getName(),
    b = batches.get(key) || { p: [], i: [], w: [], material };
  batches.set(key, b);
  const start = b.p.length / 3;
  for (const i of face) {
    let [vx, vy, vz] = raw.positions[i];
    if (material === jacket || material === shirt) {
      vx *= 1.05;
      vz = vz * 1.08 + 0.005;
    }
    if (material === pants) {
      vx *= 1.055;
      vz = Math.min(vz, 0.14) + 0.012;
    }
    if (material === shoes || material === sole) {
      vx *= 1.035;
      vz += 0.012;
    }
    b.p.push(vx, vy, vz);
    b.w.push(raw.weights[i]);
  }
  for (let k = 1; k < face.length - 1; k++)
    b.i.push(start, start + k, start + k + 1);
}
for (const b of batches.values()) primitive(b.p, b.i, b.w, b.material);
function ellipsoid(
  center,
  radius,
  material,
  bone = 'head',
  cap = Math.PI,
  tilt = 0,
) {
  const p = [],
    ids = [],
    w = [],
    rows = 10,
    cols = 18;
  for (let y = 0; y <= rows; y++)
    for (let x = 0; x <= cols; x++) {
      const theta = (y / rows) * cap,
        phi = (x / cols) * Math.PI * 2;
      let dx = radius[0] * Math.sin(theta) * Math.cos(phi),
        dy = radius[1] * Math.cos(theta);
      const px = dx * Math.cos(tilt) - dy * Math.sin(tilt),
        py = dx * Math.sin(tilt) + dy * Math.cos(tilt);
      p.push(
        center[0] + px,
        center[1] + py,
        center[2] + radius[2] * Math.sin(theta) * Math.sin(phi),
      );
      w.push([[boneIndex[bone], 1]]);
    }
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const a = y * (cols + 1) + x,
        b = a + cols + 1;
      ids.push(a, a + 1, b, a + 1, b + 1, b);
    }
  primitive(p, ids, w, material);
}
// Anatomical alignment: the face projects to z~.165, not .118. Hair/sunglasses
// now follow the actual source bounds instead of being embedded in the head.
function sweptHair() {
  const p = [],
    w = [],
    ids = [],
    rows = 18,
    cols = 48;
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c <= cols; c++) {
      const phi = (c / cols) * Math.PI * 2,
        cap = 1.75 - 0.21 * Math.sin(phi),
        theta = (r / rows) * cap,
        swirl = 0.004 * Math.sin(phi * 11 + theta * 5) * Math.sin(theta),
        rad = 0.098 + swirl;
      p.push(
        rad * Math.sin(theta) * Math.cos(phi) -
          0.01 * Math.pow(Math.cos(theta), 2),
        1.765 + (0.078 + swirl) * Math.cos(theta),
        0.061 + 0.102 * Math.sin(theta) * Math.sin(phi),
      );
      w.push([[boneIndex.head, 1]]);
    }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c,
        b = a + cols + 1;
      ids.push(a, a + 1, b, a + 1, b + 1, b);
    }
  primitive(p, ids, w, hair);
}
sweptHair();
for (let i = 0; i < 9; i++)
  ellipsoid(
    [-0.073 + i * 0.018, 1.816 + Math.sin(i * 0.7) * 0.013, 0.071],
    [0.014, 0.025, 0.067],
    hair,
    'head',
    Math.PI,
    0.48,
  );
for (const x of [-0.043, 0.043]) {
  ellipsoid([x, 1.711, 0.176], [0.043, 0.027, 0.009], frame);
  ellipsoid([x, 1.712, 0.184], [0.036, 0.02, 0.006], glass);
  ellipsoid([Math.sign(x) * 0.087, 1.71, 0.095], [0.004, 0.005, 0.082], frame);
}
ellipsoid([0, 1.715, 0.18], [0.015, 0.004, 0.006], frame);
// Original tailored shell volumes: jacket, sleeves and loose trouser legs.
function loft(rings, material, sectorMaterial = null) {
  const p = [],
    w = [],
    indices = [],
    alt = [],
    cols = 24;
  for (const ring of rings)
    for (let c = 0; c <= cols; c++) {
      const a = (c / cols) * Math.PI * 2;
      p.push(
        ring.center[0] + Math.cos(a) * ring.rx,
        ring.center[1],
        ring.center[2] + Math.sin(a) * ring.rz,
      );
      w.push(ring.weights || [[boneIndex[ring.bone], 1]]);
    }
  for (let y = 0; y < rings.length - 1; y++)
    for (let c = 0; c < cols; c++) {
      const a = y * (cols + 1) + c,
        b = a + cols + 1;
      if (sectorMaterial && Math.sin(((c + 0.5) / cols) * Math.PI * 2) > 0.86)
        continue;
      const target = indices;
      if (rings[y + 1].center[1] > rings[y].center[1])
        target.push(a, b, a + 1, a + 1, b, b + 1);
      else target.push(a, a + 1, b, a + 1, b + 1, b);
    }
  primitive(p, indices, w, material);
  if (alt.length) primitive(p, alt, w, sectorMaterial);
}
loft(
  [
    { center: [0, 1.015, 0.018], rx: 0.183, rz: 0.117, bone: 'spine_01' },
    { center: [0, 1.05, 0.018], rx: 0.193, rz: 0.126, bone: 'spine_01' },
    { center: [0, 1.24, 0.015], rx: 0.202, rz: 0.13, bone: 'spine_02' },
    { center: [0, 1.43, 0.018], rx: 0.244, rz: 0.14, bone: 'spine_03' },
    { center: [0, 1.5, 0.026], rx: 0.224, rz: 0.135, bone: 'spine_03' },
    { center: [0, 1.555, 0.028], rx: 0.081, rz: 0.071, bone: 'spine_03' },
  ],
  jacket,
  shirt,
);
loft(
  [
    { center: [0, 1.01, 0.025], rx: 0.18, rz: 0.105, bone: 'spine_01' },
    { center: [0, 1.23, 0.028], rx: 0.18, rz: 0.114, bone: 'spine_02' },
    { center: [0, 1.445, 0.035], rx: 0.207, rz: 0.116, bone: 'spine_03' },
    { center: [0, 1.53, 0.035], rx: 0.07, rz: 0.063, bone: 'spine_03' },
  ],
  shirt,
);
loft(
  [
    { center: [0, 1.51, 0.034], rx: 0.074, rz: 0.068, bone: 'spine_03' },
    { center: [0, 1.545, 0.033], rx: 0.071, rz: 0.066, bone: 'spine_03' },
  ],
  shirt,
);
for (const side of ['l', 'r']) {
  const hip = heads[boneIndex['thigh_' + side]],
    knee = heads[boneIndex['calf_' + side]],
    foot = heads[boneIndex['foot_' + side]];
  loft(
    [
      { center: hip, rx: 0.103, rz: 0.118, bone: 'thigh_' + side },
      {
        center: hip.map((v, i) => v * 0.52 + knee[i] * 0.48),
        rx: 0.112,
        rz: 0.114,
        bone: 'thigh_' + side,
      },
      {
        center: knee.map((v, i) => v + (i === 1 ? 0.065 : 0)),
        rx: 0.096,
        rz: 0.095,
        weights: [
          [boneIndex['thigh_' + side], 0.5],
          [boneIndex['calf_' + side], 0.5],
        ],
      },
      { center: [...knee], rx: 0.091, rz: 0.092, bone: 'calf_' + side },
      {
        center: knee.map((v, i) => v * 0.7 + foot[i] * 0.3),
        rx: 0.097,
        rz: 0.094,
        bone: 'calf_' + side,
      },
      {
        center: knee.map((v, i) => v * 0.35 + foot[i] * 0.65),
        rx: 0.078,
        rz: 0.079,
        bone: 'calf_' + side,
      },
      {
        center: [foot[0], foot[1] + 0.035, foot[2]],
        rx: 0.062,
        rz: 0.068,
        bone: 'foot_' + side,
      },
    ],
    pants,
  );
  const shoulder = heads[boneIndex['upperarm_' + side]],
    elbow = heads[boneIndex['lowerarm_' + side]],
    hand = heads[boneIndex['hand_' + side]];
  ellipsoid(shoulder, [0.079, 0.065, 0.078], jacket, 'upperarm_' + side);
  const p = [],
    ids = [],
    w = [],
    points = [
      shoulder,
      elbow,
      hand.map((x, i) => elbow[i] + (x - elbow[i]) * 0.88),
    ],
    radii = [0.078, 0.07, 0.053],
    cols = 18;
  for (let r = 0; r < 3; r++) {
    const dir =
      r === 2
        ? points[2].map((x, i) => x - points[1][i])
        : points[r + 1].map((x, i) => x - points[r][i]);
    const len = Math.hypot(...dir);
    for (let i = 0; i < 3; i++) dir[i] /= len;
    const u = [dir[1], -dir[0], 0],
      ul = Math.hypot(...u);
    for (let i = 0; i < 3; i++) u[i] /= ul;
    const v = [
      dir[1] * u[2] - dir[2] * u[1],
      dir[2] * u[0] - dir[0] * u[2],
      dir[0] * u[1] - dir[1] * u[0],
    ];
    for (let c = 0; c <= cols; c++) {
      const a = (c / cols) * Math.PI * 2;
      for (let k = 0; k < 3; k++)
        p.push(
          points[r][k] + radii[r] * (u[k] * Math.cos(a) + v[k] * Math.sin(a)),
        );
      w.push([[boneIndex[(r === 0 ? 'upperarm_' : 'lowerarm_') + side], 1]]);
    }
  }
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c,
        b = a + cols + 1;
      ids.push(a, a + 1, b, a + 1, b + 1, b);
    }
  primitive(p, ids, w, jacket);
  ellipsoid(
    [foot[0], foot[1] - 0.02, foot[2] + 0.08],
    [0.067, 0.049, 0.137],
    shoes,
    'foot_' + side,
  );
  ellipsoid(
    [foot[0], foot[1] - 0.052, foot[2] + 0.08],
    [0.068, 0.012, 0.139],
    sole,
    'foot_' + side,
  );
}
// Cargo flap volumes, shoe panels and blue shoulder accents, rigidly skinned.
for (const side of ['l', 'r']) {
  const s = side === 'l' ? 1 : -1;
  ellipsoid(
    [s * 0.134, 0.67, 0.109],
    [0.063, 0.07, 0.019],
    pants,
    'thigh_' + side,
  );
  const foot = heads[boneIndex['foot_' + side]];
  ellipsoid(
    [foot[0], foot[1] + 0.01, foot[2] + 0.13],
    [0.052, 0.018, 0.065],
    blue,
    'foot_' + side,
  );
  ellipsoid(
    [s * 0.19, 1.445, 0.062],
    [0.05, 0.012, 0.04],
    blue,
    'upperarm_' + side,
  );
}
function panel(points, material, bone) {
  const a = points[1].map((v, i) => v - points[0][i]),
    b = points[2].map((v, i) => v - points[0][i]),
    n = [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ],
    Y = points.reduce((s, p) => s + p[1] / 4, 0),
    Z = points.reduce((s, p) => s + p[2] / 4, 0);
  if ((Y < 0.3 ? n[1] : n[2] * Math.sign(Z)) < 0) points = points.toReversed();
  primitive(
    points.flat(),
    [0, 1, 2, 0, 2, 3],
    points.map(() => [[boneIndex[bone], 1]]),
    material,
  );
}
for (const side of ['l', 'r']) {
  const s = side === 'l' ? 1 : -1;
  // Folded collar/lapel geometry, not anatomical body recolouring.
  panel(
    [
      [s * 0.075, 1.545, 0.1],
      [s * 0.13, 1.49, 0.14],
      [s * 0.11, 1.37, 0.16],
      [s * 0.065, 1.46, 0.16],
    ],
    jacket,
    'spine_03',
  );
  // Wide opening edges and sewn pocket flaps (not painted skin).
  panel(
    [
      [s * 0.096, 1.03, 0.137],
      [s * 0.105, 1.03, 0.142],
      [s * 0.13, 1.47, 0.14],
      [s * 0.118, 1.47, 0.14],
    ],
    stitching,
    'spine_02',
  );
  panel(
    [
      [s * 0.105, 1.14, 0.145],
      [s * 0.18, 1.17, 0.127],
      [s * 0.18, 1.193, 0.128],
      [s * 0.105, 1.165, 0.146],
    ],
    jacket,
    'spine_02',
  );
  const hip = heads[boneIndex['thigh_' + side]],
    foot = heads[boneIndex['foot_' + side]];
  ellipsoid(
    [hip[0] + s * 0.06, 0.72, 0.096],
    [0.06, 0.095, 0.035],
    pants,
    'thigh_' + side,
  );
  panel(
    [
      [hip[0] - 0.055, 0.76, 0.132],
      [hip[0] + 0.055, 0.76, 0.132],
      [hip[0] + 0.055, 0.78, 0.133],
      [hip[0] - 0.055, 0.78, 0.133],
    ],
    jacket,
    'thigh_' + side,
  );
  // Sneaker tongue and actual laces at the true bind-space foot positions.
  ellipsoid(
    [foot[0], 0.13, 0.142],
    [0.049, 0.022, 0.083],
    shoes,
    'foot_' + side,
  );
  for (let j = 0; j < 5; j++)
    panel(
      [
        [foot[0] - 0.044, 0.144 - j * 0.002, 0.11 + j * 0.019],
        [foot[0] + 0.044, 0.144 - j * 0.002, 0.117 + j * 0.019],
        [foot[0] + 0.044, 0.15 - j * 0.002, 0.123 + j * 0.019],
        [foot[0] - 0.044, 0.15 - j * 0.002, 0.116 + j * 0.019],
      ],
      sole,
      'foot_' + side,
    );
}
// Original embroidered open C on the breast and a back yoke seam.
panel(
  [
    [0.112, 1.39, 0.165],
    [0.155, 1.39, 0.153],
    [0.155, 1.43, 0.153],
    [0.112, 1.43, 0.165],
  ],
  sole,
  'spine_03',
);
panel(
  [
    [-0.177, 1.375, -0.122],
    [0.177, 1.375, -0.122],
    [0.177, 1.381, -0.122],
    [-0.177, 1.381, -0.122],
  ],
  stitching,
  'spine_03',
);
const model = d
  .createNode('CodeVerse original hero / early fitted-shell iteration')
  .setMesh(mesh)
  .setSkin(skin);
scene.addChild(model);
const quat = (axis, angle) => {
  const q = [0, 0, 0, Math.cos(angle / 2)];
  q[axis] = Math.sin(angle / 2);
  return q;
};
const profiles = [
  ['Idle', 2.5, 0],
  ['Walk', 1.05, 0.38],
  ['Run', 0.65, 0.7],
];
for (const [name, duration, stride] of profiles) {
  const animation = d.createAnimation(name);
  const steps = 40,
    times = Float32Array.from(
      { length: steps + 1 },
      (_, i) => (i / steps) * duration,
    );
  const channels = [
    ['upperarm_l', 2, -0.6, 0],
    ['upperarm_r', 2, 0.6, 0],
    ['thigh_l', 2, -0.11, 0],
    ['thigh_r', 2, 0.11, 0],
    ['upperarm_l', 0, 0, -0.6],
    ['upperarm_r', 0, 0, 0.6],
    ['thigh_l', 0, 0, 1],
    ['thigh_r', 0, 0, -1],
    ['calf_l', 0, 0, 1],
    ['calf_r', 0, 0, -1],
  ];
  // Compose the original joint rotations into a single channel per bone.
  const names = [...new Set([...channels.map((c) => c[0]), 'spine_03'])];
  for (const bone of names) {
    const values = [];
    for (let i = 0; i <= steps; i++) {
      const phase = (i / steps) * Math.PI * 2;
      const z = channels.find((c) => c[0] === bone && c[1] === 2)?.[2] || 0;
      let x =
        (channels.find((c) => c[0] === bone && c[1] === 0)?.[3] || 0) *
        stride *
        Math.sin(phase);
      if (bone.startsWith('calf')) x = -Math.max(0, x) * 1.6;
      if (bone === 'spine_03') x = 0.009 * Math.sin(phase);
      const qx = quat(0, x),
        qz = quat(2, z);
      values.push(qx[0] * qz[3], -qx[0] * qz[2], qx[3] * qz[2], qx[3] * qz[3]);
    }
    const sampler = d
      .createAnimationSampler()
      .setInput(acc('time', 'SCALAR', times))
      .setOutput(acc('rotation', 'VEC4', new Float32Array(values)))
      .setInterpolation('LINEAR');
    animation
      .addSampler(sampler)
      .addChannel(
        d
          .createAnimationChannel()
          .setTargetNode(boneNodes[boneIndex[bone]])
          .setTargetPath('rotation')
          .setSampler(sampler),
      );
  }
}
const { dedup, weld, prune, joinPrimitives } = await load(
  '@gltf-transform/functions/dist/index.js',
);
for (const material of d.getRoot().listMaterials()) {
  const parts = mesh
    .listPrimitives()
    .filter((p) => p.getMaterial() === material);
  if (parts.length > 1) {
    const joined = joinPrimitives(parts);
    for (const part of parts) {
      mesh.removePrimitive(part);
      part.dispose();
    }
    mesh.addPrimitive(joined);
  }
}
await d.transform(dedup(), weld(), prune());
const bytes = await new NodeIO().writeBinary(d);
await fs.writeFile('public/assets/g1/hero.glb', bytes);
const validation = await validator.validateBytes(bytes, {
  uri: 'hero.glb',
  writeTimestamp: false,
});
await fs.writeFile(
  'docs/evidence/g1/hero-validation.json',
  JSON.stringify(validation, null, 2) + '\n',
);
assert.equal(validation.issues.numErrors, 0);
await fs.writeFile(
  'public/assets/g1/hero-provenance.json',
  JSON.stringify(
    {
      scope: raw.scope,
      sourceArchiveSha256:
        'ada7c4ff11e79cf6ed9b441bccabc52c9359f2848b988f66e89c14c30b21fed7',
      outputSha256: createHash('sha256').update(bytes).digest('hex'),
      outputBytes: bytes.length,
      skin: '53 source-position joints, identity global bind axes; normalized original weights including >4',
      animation:
        'Original authored joint cycles, not Quaternius, 100STYLE, mocap or MPFB retarget',
      limitations: [
        'Early garment shells, not production tailoring',
        'Hand-authored initial gait, no foot IK/stride acceptance',
        'No macro targets or Blender bone-roll equivalence',
        'Premium character quality not accepted',
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Original dressed hero exported:',
  bytes.length,
  'bytes; validation',
  validation.issues.numErrors,
  'errors',
  validation.issues.numWarnings,
  'warnings',
);
