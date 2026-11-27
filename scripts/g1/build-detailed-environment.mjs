/* global console */
// Original G1 renovation. Completed A1 construction/source/evidence stays intact.
import fs from 'node:fs/promises';
import { tangentsFor } from './geometry-utils.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const load = (p) =>
  import(pathToFileURL(path.resolve('.cache/a1/tools/node_modules', p)).href);
const { Document, NodeIO } = await load('@gltf-transform/core/dist/index.js');
const { dedup, weld, prune } = await load(
  '@gltf-transform/functions/dist/index.js',
);
const validator = await load('gltf-validator/index.js');
const io = new NodeIO();
const H = (y) => (y <= 4.8 ? y : 4.8 + (y - 4.8) * 0.65);
const shell = await io.read('public/assets/g1/landmark.glb');
for (const node of shell.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  if (/^(front|left|right|rear|entry|roof):/.test(mesh.getName()))
    for (const p of mesh.listPrimitives()) {
      const a = p.getAttribute('POSITION'),
        v = new Float32Array(a.getArray());
      for (let i = 1; i < v.length; i += 3) v[i] = H(v[i]);
      a.setArray(v);
    }
}
// Retained original landmark stays unchanged; new site contains replacement envelope.
const d = new Document(),
  buffer = d.createBuffer(),
  scene = d.createScene('CodeVerse civic plaza renovation');
d.getRoot().setDefaultScene(scene);
d.getRoot().getAsset().copyright =
  'Original CodeVerse geometry and generated textures. No proprietary extraction.';
const tex = async (name, kind) =>
  d
    .createTexture(`${name} original ${kind}`)
    .setImage(
      await fs.readFile(
        `public/assets/g1/v2-${name}-${kind}.${kind === 'normal' ? 'png' : 'jpg'}`,
      ),
    )
    .setMimeType(kind === 'normal' ? 'image/png' : 'image/jpeg');
const textures = {};
for (const name of ['stone', 'basalt', 'asphalt', 'timber', 'bark', 'grass'])
  textures[name] = {
    color: await tex(name, 'color'),
    normal: await tex(name, 'normal'),
    rough: await tex(name, 'roughness'),
  };
const linear = (h) =>
  [1, 3, 5].map((i) => {
    const s = parseInt(h.slice(i, i + 2), 16) / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
function mat(
  name,
  color,
  rough = 0.7,
  metal = 0,
  family = null,
  emission = null,
) {
  const m = d
    .createMaterial(name)
    .setBaseColorFactor([...linear(color), 1])
    .setMetallicFactor(metal)
    .setRoughnessFactor(rough);
  if (family)
    m.setBaseColorTexture(textures[family].color)
      .setNormalTexture(textures[family].normal)
      .setNormalScale(0.28)
      .setMetallicRoughnessTexture(textures[family].rough);
  if (emission) m.setEmissiveFactor(emission);
  return m;
}
const M = {
  stone: mat('honed limestone coping', '#e4ddce', 0.73, 0, 'stone'),
  trim: mat('brushed bronze mullions', '#756852', 0.32, 0.75),
  dark: mat('graphite anodised framing', '#343733', 0.4, 0.65),
  blue: mat(
    'recessed blue light channel',
    '#187ce2',
    0.3,
    0.25,
    null,
    [0.015, 0.16, 0.8],
  ),
  warm: mat('warm soffit light', '#ffdc9e', 0.5, 0, null, [1, 0.57, 0.19]),
  wood: mat('oiled timber slats', '#ffffff', 1, 0, 'timber'),
  soil: mat('rich planting soil', '#534738', 1),
  asphalt: mat('aggregate asphalt', '#ffffff', 1, 0, 'asphalt'),
  paint: mat('thermoplastic road markings', '#e6e3d5', 0.85),
  grass: mat('landscape groundcover', '#ffffff', 1, 0, 'grass'),
  basalt: mat('sawn basalt bands', '#ffffff', 1, 0, 'basalt'),
  steel: mat('drain and bollard steel', '#4f606b', 0.4, 0.65),
  back: mat('warm interior wall plaster', '#a7a39a', 0.9),
  riser: mat('limestone stair risers', '#c7bcaa', 0.85, 0, 'stone'),
};
const pavers = Array.from({ length: 9 }, (_, i) =>
  mat(
    'limestone paving batch ' + i,
    [
      '#ded8cd',
      '#d1ccc3',
      '#dad5ca',
      '#d8d3c6',
      '#d4cdbf',
      '#ddd8cb',
      '#d2cfc6',
      '#ded6c7',
      '#cdd1cd',
    ][i],
    1,
    0,
    'stone',
  ),
);
const glass = Array.from({ length: 5 }, (_, i) =>
  mat(
    'neutral low iron glazing ' + i,
    ['#c8d7d3', '#c4d0c9', '#d2d8d4', '#b9ccca', '#cbd1cf'][i],
    0.075 + i * 0.012,
    0,
  )
    .setAlphaMode('BLEND')
    .setBaseColorFactor([
      ...linear(['#c8d7d3', '#c4d0c9', '#d2d8d4', '#b9ccca', '#cbd1cf'][i]),
      0.43 + i * 0.025,
    ])
    .setDoubleSided(true),
);
const bronze = mat('champagne rainscreen cassettes', '#9c8b6e', 0.42, 0.7);
const plaster = mat('interior chalk plaster', '#88877e', 0.92);
const roomBacks = ['#686e6b', '#73766d', '#8a8475', '#626b70'].map((c, i) =>
  mat('recessed interior wall tone ' + i, c, 0.95),
);
const carpet = mat('interior soft floor', '#77766d', 1);
const blinds = mat('woven roller shade', '#c5bda8', 0.92);
const slate = mat('charcoal stone cladding', '#6b6b60', 0.82, 0, 'basalt');
const contextBrick = mat(
  'warm brick architectural skin',
  '#9a7253',
  0.9,
  0,
  'stone',
);
const batches = new Map();
function quad(name, q, material, uvScale = 1) {
  const key = name + '|' + material.getName();
  let b = batches.get(key);
  if (!b) {
    b = { name, p: [], n: [], uv: [], i: [], material };
    batches.set(key, b);
  }
  const index = b.p.length / 3,
    u = q[1].map((v, i) => v - q[0][i]),
    v = q[2].map((v, i) => v - q[0][i]),
    n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ],
    len = Math.hypot(...n);
  if (len < 1e-8) return;
  const w = Math.hypot(...u) * uvScale,
    h = Math.hypot(...q[2].map((v, i) => v - q[1][i])) * uvScale;
  for (const p of q) {
    b.p.push(...p);
    b.n.push(...n.map((v) => v / len));
  }
  const phaseU = Math.sin(q[0][0] * 19.1 + q[0][2] * 7.3) * 3.1,
    phaseV = Math.cos(q[0][0] * 11.3 - q[0][2] * 17.1) * 2.3;
  b.uv.push(
    phaseU,
    phaseV,
    w + phaseU,
    phaseV,
    w + phaseU,
    h + phaseV,
    phaseU,
    h + phaseV,
  );
  b.i.push(index, index + 1, index + 2, index, index + 2, index + 3);
}
function box(name, c, s, m, angle = 0, uvScale = 1) {
  const [cx, cy, cz] = c,
    [w, h, l] = s.map((v) => v / 2),
    p = (x, y, z) => [
      cx + x * Math.cos(angle) + z * Math.sin(angle),
      cy + y,
      cz - x * Math.sin(angle) + z * Math.cos(angle),
    ];
  for (const q of [
    [
      [-w, -h, l],
      [w, -h, l],
      [w, h, l],
      [-w, h, l],
    ],
    [
      [w, -h, -l],
      [-w, -h, -l],
      [-w, h, -l],
      [w, h, -l],
    ],
    [
      [-w, -h, -l],
      [-w, -h, l],
      [-w, h, l],
      [-w, h, -l],
    ],
    [
      [w, -h, l],
      [w, -h, -l],
      [w, h, -l],
      [w, h, l],
    ],
    [
      [-w, h, l],
      [w, h, l],
      [w, h, -l],
      [-w, h, -l],
    ],
    [
      [-w, -h, -l],
      [w, -h, -l],
      [w, -h, l],
      [-w, -h, l],
    ],
  ])
    quad(
      name,
      q.map((v) => p(...v)),
      m,
      uvScale,
    );
}
function cylinder(name, c, r, h, m, segments = 16) {
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2,
      b = ((i + 1) / segments) * Math.PI * 2,
      p = (t, y) => [c[0] + r * Math.cos(t), c[1] + y, c[2] + r * Math.sin(t)];
    quad(name, [p(b, -h / 2), p(a, -h / 2), p(a, h / 2), p(b, h / 2)], m);
    quad(
      name,
      [
        [c[0], c[1] + h / 2, c[2]],
        p(b, h / 2),
        p(a, h / 2),
        [c[0], c[1] + h / 2, c[2]],
      ],
      m,
    );
  }
}
const P = (r, a, y) => [r * Math.sin(a), y, r * Math.cos(a) - 22];
function arc(
  name,
  r,
  depth,
  y,
  h,
  lo = -Math.PI / 4,
  hi = Math.PI / 4,
  m = M.stone,
) {
  const segments = Math.max(
    1,
    Math.ceil((Math.abs(hi - lo) / (Math.PI / 2)) * 96),
  );
  for (let i = 0; i < segments; i++) {
    const a = lo + ((hi - lo) * i) / segments,
      b = lo + ((hi - lo) * (i + 1)) / segments;
    quad(name, [P(r, a, y), P(r, b, y), P(r, b, y + h), P(r, a, y + h)], m);
    quad(
      name,
      [
        P(r - depth, b, y),
        P(r - depth, a, y),
        P(r - depth, a, y + h),
        P(r - depth, b, y + h),
      ],
      m,
    );
    quad(
      name,
      [
        P(r - depth, a, y + h),
        P(r, a, y + h),
        P(r, b, y + h),
        P(r - depth, b, y + h),
      ],
      m,
    );
    quad(
      name,
      [P(r - depth, b, y), P(r, b, y), P(r, a, y), P(r - depth, a, y)],
      m,
    );
  }
}
// Convex curtain wall with real 4.5m-deep interior bays and mixed structural skin.
const floors = [0, 4.2, 7.0, 9.8, 12.6, 15.4, 18.2];
for (let f = 0; f < floors.length - 1; f++) {
  const y = floors[f],
    top = floors[f + 1];
  arc(
    'slab fascia with drip edge',
    22.35,
    0.72,
    y,
    0.24,
    -Math.PI / 4,
    Math.PI / 4,
    M.stone,
  );
  arc(
    'bronze shadow reveal',
    22.4,
    0.1,
    y + 0.25,
    0.07,
    -Math.PI / 4,
    Math.PI / 4,
    M.trim,
  );
  for (let bay = 0; bay < 16; bay++) {
    const aa = -Math.PI / 4 + (bay * Math.PI) / 32,
      bb = aa + Math.PI / 32,
      a = aa + 0.006,
      b = bb - 0.006,
      c = (a + b) / 2,
      w = 2 * 21.5 * Math.sin((b - a) / 2);
    if (f === 0 && Math.abs(c) < 0.2) continue;
    const room = (r, h) => P(r, c, h);
    box(
      'interior room floor slabs',
      room(19.1, y + 0.08),
      [w + 0.08, 0.16, 5.3],
      f % 2 ? carpet : M.wood,
      c,
    );
    box(
      'interior room ceilings',
      room(19.1, top - 0.18),
      [w + 0.08, 0.13, 5.3],
      plaster,
      c,
    );
    box(
      'interior room back walls',
      room(16.5, (y + top) / 2),
      [w + 0.12, top - y, 0.14],
      roomBacks[(bay + f * 3) % 4],
      c,
    );
    for (const edge of bay % 3 === 0 ? [aa] : [])
      box(
        'interior partitions',
        P(19.1, edge, (y + top) / 2),
        [0.1, top - y, 5.2],
        plaster,
        edge,
      );
    // All curtain panels use non-metallic alpha glass; PBR handles grazing highlights.
    for (let sub = 0; sub < 2; sub++) {
      const A = a + ((b - a) * sub) / 2 + 0.001,
        B = a + ((b - a) * (sub + 1)) / 2 - 0.001;
      quad(
        'transparent glazing cassettes',
        [
          P(22.015, A, y + 0.31),
          P(22.015, B, y + 0.31),
          P(22.015, B, top - 0.2),
          P(22.015, A, top - 0.2),
        ],
        glass[(bay + f * 2) % glass.length],
      );
    }
    for (const edge of [aa, (aa + bb) / 2, bb])
      box(
        'slim curtain wall mullions',
        P(22.07, edge, (y + top) / 2),
        [0.045, top - y - 0.25, 0.16],
        M.trim,
        edge,
      );
    arc('operable transom rail', 22.08, 0.12, top - 0.62, 0.045, a, b, M.trim);
    arc(
      'recessed bronze insulated spandrel',
      22.04,
      0.14,
      y + 0.27,
      0.48,
      a,
      b,
      bronze,
    );
    // A controlled cadence of stone piers breaks up repeated blue rectangles.
    if (bay % 4 === 0 || bay === 15)
      box(
        'jointed travertine facade piers',
        P(22.25, aa, (y + top) / 2),
        [0.42, top - y - 0.035, 0.65],
        M.stone,
        aa,
      );
    if (f > 0 && (bay * 7 + f * 3) % 7 < 2) {
      const drop = 0.45 + ((bay + f) % 3) * 0.23;
      box(
        'partial woven office blinds',
        room(21.84, top - 0.28 - drop / 2),
        [w * 0.86, drop, 0.035],
        blinds,
        c,
      );
    }
    if ((bay + f) % 3 !== 0) {
      box(
        'visible office worktops',
        room(19.9, y + 0.8),
        [w * 0.67, 0.065, 0.72],
        M.wood,
        c,
      );
      for (const dx of [-0.6, 0.6]) {
        const p = room(19.9, y + 0.4);
        p[0] += Math.cos(c) * dx;
        box('desk supports', p, [0.06, 0.8, 0.6], M.dark, c);
      }
      box(
        'monitor stand',
        room(19.75, y + 0.98),
        [0.05, 0.3, 0.05],
        M.steel,
        c,
      );
      box(
        'interior monitors',
        room(19.72, y + 1.2),
        [0.55, 0.34, 0.05],
        M.dark,
        c,
      );
    }
    box(
      'recessed ceiling luminaires',
      room(19.6, top - 0.26),
      [1.1, 0.025, 0.12],
      M.warm,
      c,
    );
  }
}
// Carefully terminated stone/bronze side wings, instead of exposed see-through old cards.
for (const side of [-1, 1]) {
  box(
    'side wing stone core',
    [side * 15.55, 9.1, -15.4],
    [0.45, 18.2, 17.25],
    M.stone,
  );
  for (let f = 0; f < 6; f++)
    for (let bay = 0; bay < 7; bay++) {
      const y = floors[f],
        top = floors[f + 1],
        z = -7.1 - bay * 2.35;
      box(
        'side window deep recess',
        [side * 15.82, (y + top) / 2, z],
        [0.16, top - y - 0.45, 1.75],
        M.dark,
      );
      box(
        'side window reveals',
        [side * 15.95, (y + top) / 2, z],
        [0.07, top - y - 0.62, 1.45],
        glass[(f + bay) % 5],
      );
      for (const dz of [-0.85, 0.85])
        box(
          'side window bronze jambs',
          [side * 16.01, (y + top) / 2, z + dz],
          [0.18, top - y - 0.4, 0.045],
          M.trim,
        );
      box(
        'side stone joint courses',
        [side * 15.8, y + 0.04, z],
        [0.04, 0.025, 2.34],
        M.dark,
      );
    }
  box(
    'side bronze service panel',
    [side * 15.84, 2.0, -22.8],
    [0.09, 3.8, 1.0],
    bronze,
  );
}
box(
  'rear architectural service wall',
  [0, 9.1, -24.05],
  [31.6, 18.2, 0.35],
  M.stone,
);
for (let f = 0; f < 6; f++)
  for (let bay = 0; bay < 12; bay++)
    box(
      'rear recessed ribbon windows',
      [-14.1 + bay * 2.55, (floors[f] + floors[f + 1]) / 2, -24.26],
      [1.85, f ? 1.6 : 2.6, 0.08],
      M.dark,
    );
arc(
  'stepped roof bronze cornice',
  22.65,
  1.1,
  18.25,
  0.25,
  -Math.PI / 4,
  Math.PI / 4,
  bronze,
);
arc(
  'upper travertine parapet',
  22.3,
  0.5,
  18.5,
  0.45,
  -Math.PI / 4,
  Math.PI / 4,
  M.stone,
);
for (const side of [-1, 1])
  box('roof wing coping', [side * 15.6, 18.55, -15.3], [0.7, 0.3, 18], M.stone);
arc(
  'curved roof concrete cap',
  22.1,
  22.1,
  18.1,
  0.15,
  -Math.PI / 4,
  Math.PI / 4,
  M.stone,
);
box('rear roof concrete deck', [0, 18.16, -15.3], [31.1, 0.18, 17.4], M.stone);
// Rooftop plant deck and screened mechanical equipment give the silhouette a purpose.
box('roof plant enclosure', [7, 19.05, -15], [7, 1.6, 6], M.dark);
for (let i = 0; i < 14; i++)
  box(
    'roof louvred equipment screen',
    [3.5 + i * 0.54, 19.2, -11.8],
    [0.12, 1.9, 0.15],
    bronze,
  );
// Entrance: real recess, glazed door leaves/frames/handles and ribbed canopy.
box('entrance stone portal', [0, 2.05, -1.2], [8.9, 4.1, 0.35], plaster);
box('lobby polished floor', [0, 0.04, -3], [8.5, 0.08, 5], M.basalt);
box('lobby reception desk', [1, 0.6, -2.7], [2.5, 1.2, 0.7], M.wood);
for (const x of [-3.95, 3.95])
  box('entrance stone jambs', [x, 2.03, 0], [0.3, 4.06, 0.8], M.stone);
for (const x of [-2.65, -0.88, 0.88, 2.65]) {
  box(
    'entrance glazed door leaves',
    [x, 1.93, 0.02],
    [1.65, 3.72, 0.065],
    glass[2],
  );
  for (const s of [-1, 1])
    box(
      'door mullions',
      [x + s * 0.837, 1.93, 0.09],
      [0.045, 3.8, 0.085],
      M.dark,
    );
  box('door top rail', [x, 3.82, 0.09], [1.72, 0.055, 0.085], M.trim);
  if (Math.abs(x) < 1)
    box(
      'door handles',
      [x + Math.sign(x) * 0.55, 1.45, 0.18],
      [0.035, 0.7, 0.06],
      M.trim,
    );
}
box('entrance floating canopy', [0, 4.16, 1.45], [10.2, 0.26, 4.6], M.dark);
box('canopy stone top', [0, 4.33, 1.45], [10.4, 0.08, 4.8], M.stone);
for (let x = -4.8; x < 5; x += 0.23)
  box('soffit timber ribs', [x, 4.0, 1.45], [0.085, 0.12, 4.2], M.wood, 0, 3);
for (const x of [-4.7, 4.7]) {
  box('entrance columns', [x, 2.1, 2.3], [0.18, 4.2, 0.24], M.trim);
  box('canopy warm light lines', [x, 3.91, 1.4], [0.045, 0.035, 4.05], M.warm);
}
box(
  'landmark media facade shadow box',
  [0, 11.4, 1.12],
  [8.3, 2.45, 0.45],
  M.dark,
);
box('media facade raised border', [0, 12.66, 1.17], [8.4, 0.055, 0.65], M.trim);
box(
  'media facade blue underline',
  [0, 10.15, 1.37],
  [8.3, 0.025, 0.08],
  M.blue,
);
// Original angular open-hexagon C emblem, geometry not copied from a game logo.
const logo = [
  [-0.7, -0.9],
  [-1.4, 0],
  [-0.7, 0.9],
  [0.9, 0.9],
  [1.35, 0.4],
  [0.1, 0.4],
  [-0.35, 0],
  [0.1, -0.4],
  [1.35, -0.4],
  [0.9, -0.9],
  [-0.7, -0.9],
];
for (let i = 0; i < logo.length - 1; i++) {
  const a = logo[i],
    b = logo[i + 1],
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    len = Math.hypot(dx, dy),
    nx = (-dy / len) * 0.045,
    ny = (dx / len) * 0.045;
  quad(
    'original illuminated open C emblem',
    [
      [a[0] + nx, 14.1 + a[1] * 0.65 + ny, 1.15],
      [a[0] - nx, 14.1 + a[1] * 0.65 - ny, 1.15],
      [b[0] - nx, 14.1 + b[1] * 0.65 - ny, 1.15],
      [b[0] + nx, 14.1 + b[1] * 0.65 + ny, 1.15],
    ],
    M.blue,
  );
}
// Varied jointed paving, dark circulation ribbons and edge course. Clear centre route.
for (let iz = 0; iz < 10; iz++)
  for (let ix = 0; ix < 40; ix++) {
    const x = -24 + (ix + 0.5) * 1.2,
      z = (iz + 0.5) * 1.2;
    box(
      'plaza staggered stone units',
      [x, -0.052, z],
      [1.182, 0.1, 1.182],
      pavers[(ix * 13 + iz * 7) % 9],
      0,
      1.2,
    );
  }
for (const x of [-5.7, 5.7])
  box(
    'wide basalt route borders',
    [x, 0.007, 6],
    [0.55, 0.028, 12],
    M.basalt,
    0,
    2,
  );
for (let z = 0; z < 22.2; z += 0.6)
  for (const x of [-1.64, -0.55, 0.55, 1.64]) {
    if (z < 12) continue;
    box(
      'approach stone coursing',
      [x, -0.045, z + 0.3],
      [1.075, 0.09, 0.585],
      pavers[(Math.round(z * 10) + Math.round(x * 10) + 200) % 9],
      0,
      1.4,
    );
  }
for (const x of [-2.03, 2.03])
  box(
    'pedestrian link stone edging',
    [x, -0.06, 17.2],
    [0.17, 0.2, 10.4],
    M.stone,
  );
// Continuous accessible 1:12 approach ramp, restored rather than hidden with the old link batch.
quad(
  'continuous stone approach ramp',
  [
    [-0.9, -0.15, 24],
    [0.9, -0.15, 24],
    [0.9, 0, 22.2],
    [-0.9, 0, 22.2],
  ],
  pavers[3],
);
for (const x of [-1.47, 1.47])
  box('ramp side cheek stones', [x, -0.05, 23.08], [1.08, 0.2, 1.77], M.stone);
// Textured service aprons cover the formerly exposed uniform-white site plinth.
box(
  'continuous rear civic paving',
  [0, -0.018, -12.05],
  [47.8, 0.04, 24.1],
  pavers[6],
  0,
  0.65,
);
for (const side of [-1, 1])
  box(
    'sawn service apron paving',
    [side * 19.6, -0.018, -12.1],
    [8.6, 0.04, 24],
    pavers[6],
    0,
    0.65,
  );
box(
  'rear service apron paving',
  [0, -0.018, -25.15],
  [47, 0.04, 2.5],
  pavers[6],
  0,
  0.65,
);
// Side terrace steps articulate the section without obstructing the flush centre entrance route.
for (const side of [-1, 1]) {
  for (let s = 0; s < 3; s++)
    box(
      'side entrance terrace steps',
      [side * 11, 0.055 + s * 0.08, 0.15 - s * 0.48],
      [5.2, 0.11 + s * 0.16, 3.7 - s * 0.96],
      M.riser,
    );
  box(
    'terrace upper coping',
    [side * 11, 0.31, -0.65],
    [5.25, 0.06, 2.1],
    M.stone,
  );
}
function planter(x, z, w = 2.8, l = 2.8) {
  box('raised limestone planters', [x, 0.24, z], [w, 0.48, l], M.riser);
  box('planter cap lip', [x, 0.5, z], [w + 0.08, 0.08, l + 0.08], M.stone);
  box('inset planter soil', [x, 0.547, z], [w - 0.3, 0.025, l - 0.3], M.soil);
  box(
    'planter dark recessed base',
    [x, 0.055, z],
    [w - 0.12, 0.11, l - 0.12],
    M.dark,
  );
}
for (const [x, z] of [
  [-17.5, 3],
  [17.5, 3],
  [12, 8.5],
])
  planter(x, z);
for (const side of [-1, 1])
  for (const z of [-12, -4, 9]) planter(side * 22, z, 2.4, 4.3);
function bench(x, z) {
  for (const dx of [-0.82, 0.82]) {
    box('cast bench supports', [x + dx, 0.23, z], [0.14, 0.46, 0.68], M.dark);
    box('bench support feet', [x + dx, 0.05, z], [0.32, 0.1, 0.82], M.trim);
  }
  for (let j = 0; j < 5; j++)
    box(
      'rounded timber seat slats',
      [x, 0.51, z - 0.32 + j * 0.16],
      [2.1, 0.075, 0.135],
      M.wood,
      0,
      3,
    );
  for (let j = 0; j < 3; j++)
    box(
      'timber back slats',
      [x, 0.78 + j * 0.145, z - 0.39],
      [2.1, 0.1, 0.065],
      M.wood,
      0,
      3,
    );
}
bench(-8, 5);
bench(8, 5);
bench(-8, 9);
for (const side of [-1, 1]) {
  // Built landscape wall defines the small site instead of a naked floating slab.
  box(
    'perimeter retaining wall',
    [side * 24, 0.12, -7],
    [0.38, 0.54, 38],
    M.riser,
  );
  box('perimeter coping', [side * 24, 0.42, -7], [0.5, 0.08, 38.1], M.stone);
  for (let z = -18; z <= 10; z += 7) {
    cylinder('bollard metal body', [side * 20.3, 0.46, z], 0.075, 0.9, M.dark);
    cylinder(
      'bollard light collar',
      [side * 20.3, 0.73, z],
      0.08,
      0.085,
      M.warm,
    );
  }
  // Slatted shade structures frame garden edges, outside the movement route.
  for (const z of [-7, 6]) {
    for (const dx of [-1, 1])
      box(
        'pergola steel uprights',
        [side * 20.4 + dx * 1.4, 1.5, z],
        [0.095, 3, 0.095],
        M.dark,
      );
    for (let j = 0; j < 12; j++)
      box(
        'pergola timber roof',
        [side * 20.4, 3.05, z - 1.4 + j * 0.25],
        [3.2, 0.09, 0.115],
        M.wood,
        0,
        2,
      );
  }
}
// Road proper: aggregate, curb units, sidewalks, zebra crossing, tactile paving and drains.
box(
  'aggregate road wearing course',
  [0, -0.168, 28],
  [180, 0.04, 8],
  M.asphalt,
  0,
  0.65,
);
for (const side of [-1, 1]) {
  const z = side === -1 ? 23.6 : 32.35;
  for (let x = -89.5; x <= 89.5; x += 0.9) {
    if (side === -1 && Math.abs(x) < 1.5) continue;
    box(
      'individual road curb units',
      [x, -0.055, z],
      [0.88, 0.21, 0.26],
      M.stone,
    );
  }
}
for (const x of [-8, 8])
  box('north sidewalk fields', [x, -0.055, 23.15], [11.7, 0.1, 1.1], pavers[2]);
box('south sidewalk', [0, -0.05, 33.2], [180, 0.14, 1.45], pavers[2]);
for (let x = -87.5; x < 90; x += 3.4) {
  if (Math.abs(x) < 2.5) continue;
  box('road centre dashes', [x, -0.143, 28], [1.8, 0.008, 0.12], M.paint);
}
for (let z = 24.45; z < 32; z += 0.9)
  box('pedestrian crossing bars', [0, -0.142, z], [2.7, 0.009, 0.42], M.paint);
for (const z of [24.2, 31.8])
  for (const x of [-11.6, 11.6]) {
    box('storm drain recess', [x, -0.137, z], [0.75, 0.012, 0.3], M.dark);
    for (let j = 0; j < 8; j++)
      box(
        'drain slots',
        [x - 0.31 + j * 0.09, -0.129, z],
        [0.025, 0.012, 0.28],
        M.steel,
      );
  }
for (const x of [-13.8, 13.8])
  for (const z of [25.4, 27.2, 29, 30.8]) {
    cylinder('road boundary bollards', [x, 0.22, z], 0.095, 0.72, M.dark);
    cylinder('road bollard reflector', [x, 0.46, z], 0.098, 0.07, M.paint);
  }
// The road continues beyond the small playable area; no floating asphalt test slab.
for (const side of [-1, 1])
  box(
    'context north sidewalk',
    [side * 52, -0.055, 23.15],
    [76, 0.1, 1.1],
    pavers[2],
  );
for (const z of [24.25, 31.75])
  box('continuous road edge lines', [0, -0.141, z], [180, 0.009, 0.1], M.paint);
// Urban composition: secondary streets, block sidewalks and distinct facade families.
for (const side of [-1, 1]) {
  box(
    'context cross street',
    [side * 29, -0.19, -12],
    [7, 0.035, 70],
    M.asphalt,
    0,
    0.75,
  );
  for (const edge of [-1, 1])
    box(
      'context street pavements',
      [side * 29 + edge * 4.2, -0.08, -12],
      [1.35, 0.18, 70],
      pavers[2],
    );
  for (let z = -44; z < 22; z += 4)
    box(
      'context lane markings',
      [side * 29, -0.16, z],
      [0.12, 0.012, 2],
      M.paint,
    );
}
box(
  'context rear cross street',
  [0, -0.19, -36],
  [140, 0.035, 7],
  M.asphalt,
  0,
  0.75,
);
for (const side of [-1, 1])
  box(
    'context rear sidewalks',
    [0, -0.08, -36 + side * 4.2],
    [140, 0.18, 1.3],
    pavers[2],
  );
for (const [k, x, z, w, depth, floors] of [
  [0, -43, -13, 17, 20, 7],
  [1, -40, -52, 18, 19, 11],
  [2, -12, -60, 19, 18, 15],
  [3, 15, -53, 17, 15, 9],
  [4, 44, -17, 18, 20, 8],
  [5, 68, -49, 16, 17, 12],
  [6, -66, -27, 15, 17, 6],
  [7, 46, 54, 17, 17, 7],
  [8, -44, 56, 18, 18, 8],
  [9, -21, 53, 18, 18, 5],
  [10, 3, 56, 23, 22, 7],
  [11, 27, 53, 17, 18, 4],
  [12, -45, 15, 17, 19, 5],
  [13, 46, 14, 18, 19, 6],
  [14, -71, 49, 18, 20, 5],
  [15, 72, 49, 18, 20, 6],
  [16, -72, 10, 18, 20, 4],
  [17, 72, 11, 18, 20, 4],
]) {
  const h = floors * 3.0,
    skin = k % 3 === 0 ? contextBrick : k % 3 === 1 ? slate : M.stone;
  box(
    'context urban block apron',
    [x, -0.13, z],
    [w + 4, 0.25, depth + 4],
    pavers[2],
  );
  box('context articulated masonry body', [x, h / 2, z], [w, h, depth], skin);
  // Stepped upper floors and setbacks vary skyline rather than cloning a glass box.
  if (k % 2 === 0)
    box(
      'context stepped upper volume',
      [x - w * 0.12, h + 2.8, z],
      [w * 0.7, 5.6, depth * 0.65],
      skin,
    );
  for (let f = 0; f < floors; f++) {
    for (let j = 0; j < Math.floor(w / 2.7); j++)
      for (const face of [-1, 1]) {
        const xx = x - w / 2 + 1.5 + j * 2.7,
          yy = 1.8 + f * 3.0;
        box(
          'context recessed dark window',
          [xx, yy, z + face * (depth / 2 + 0.035)],
          [1.5, 1.85, 0.08],
          M.dark,
        );
        box(
          'context neutral window glint',
          [xx, yy + 0.12, z + face * (depth / 2 + 0.085)],
          [1.38, 1.52, 0.035],
          glass[(j + f + k) % 5],
        );
        box(
          'context window stone sills',
          [xx, yy - 0.95, z + face * (depth / 2 + 0.15)],
          [1.7, 0.09, 0.28],
          M.stone,
        );
      }
    // All four elevations are finished: no giant blank walls in the side-street view.
    for (let j = 0; j < Math.floor(depth / 2.8); j++)
      for (const face of [-1, 1]) {
        const zz = z - depth / 2 + 1.6 + j * 2.8,
          yy = 1.8 + f * 3;
        box(
          'context side window recess',
          [x + face * (w / 2 + 0.035), yy, zz],
          [0.08, 1.85, 1.45],
          M.dark,
        );
        box(
          'context side window glint',
          [x + face * (w / 2 + 0.09), yy + 0.1, zz],
          [0.035, 1.5, 1.3],
          glass[(j + f + k) % 5],
        );
        box(
          'context side stone sills',
          [x + face * (w / 2 + 0.15), yy - 0.95, zz],
          [0.28, 0.09, 1.65],
          M.stone,
        );
      }
    if (k % 3 === 1)
      for (const side of [-1, 1])
        box(
          'context projecting balcony slabs',
          [x + side * w * 0.25, 0.5 + f * 3, z + depth / 2 + 0.5],
          [w * 0.4, 0.15, 1.1],
          M.stone,
        );
  }
  for (let j = 0; j < 5; j++)
    box(
      'context shop front glazing',
      [x - w * 0.4 + j * w * 0.2, 1.5, z + depth / 2 + 0.1],
      [w * 0.17, 2.6, 0.1],
      M.dark,
    );
  box(
    'context ground shop canopy',
    [x, 2.95, z + depth / 2 + 0.7],
    [w, 0.14, 1.5],
    k % 2 ? M.trim : M.wood,
  );
  box(
    'context cornice caps',
    [x, h + 0.15, z],
    [w + 0.45, 0.3, depth + 0.45],
    M.stone,
  );
  box(
    'context rooftop plant rooms',
    [x + w * 0.2, h + 1, z - depth * 0.2],
    [w * 0.24, 2, depth * 0.24],
    M.dark,
  );
}
// Low civic garden beds and street luminaires give the approach intentional edges.
for (const side of [-1, 1]) {
  box(
    'approach garden retaining plinth',
    [side * 8, -0.12, 18],
    [7, 0.6, 8.2],
    M.riser,
  );
  box('approach garden coping', [side * 8, 0.2, 18], [7.1, 0.08, 8.3], M.stone);
  box(
    'approach garden growing medium',
    [side * 8, 0.25, 18],
    [6.6, 0.025, 7.8],
    M.soil,
  );
}
for (const [x, z] of [
  [-18, 11],
  [18, 11],
  [-9, 33.7],
  [-37, 33.7],
  [37, 33.7],
  [-65, 33.7],
  [65, 33.7],
  [9, 33.7],
]) {
  cylinder('architectural street light bases', [x, 0.15, z], 0.18, 0.3, M.dark);
  cylinder('tapered street light shafts', [x, 2.5, z], 0.065, 5, M.dark);
  box('cantilever light arms', [x + 0.65, 4.96, z], [1.4, 0.09, 0.1], M.dark);
  box('street light housings', [x + 1.15, 4.91, z], [0.75, 0.09, 0.35], M.dark);
  box(
    'street light opal diffusers',
    [x + 1.15, 4.86, z],
    [0.68, 0.025, 0.28],
    M.warm,
  );
}
// Original civic orbital sculpture, a static architectural focal point, not a game system.
function tube(name, A, B, r, m) {
  const D = B.map((v, i) => v - A[i]),
    length = Math.hypot(...D),
    N = D.map((v) => v / length);
  let U = Math.abs(N[1]) < 0.9 ? [N[2], 0, -N[0]] : [0, -N[2], N[1]];
  const ul = Math.hypot(...U);
  U = U.map((v) => v / ul);
  const V = [
      N[1] * U[2] - N[2] * U[1],
      N[2] * U[0] - N[0] * U[2],
      N[0] * U[1] - N[1] * U[0],
    ],
    P = (C, a) =>
      C.map((v, i) => v + r * (U[i] * Math.cos(a) + V[i] * Math.sin(a)));
  for (let j = 0; j < 6; j++) {
    const a = (j / 6) * Math.PI * 2,
      b = ((j + 1) / 6) * Math.PI * 2;
    quad(name, [P(A, b), P(A, a), P(B, a), P(B, b)], m);
  }
}
cylinder(
  'public art circular plinth',
  [-5, 0.14, 9.3],
  1.04,
  0.28,
  M.riser,
  48,
);
cylinder('public art coping', [-5, 0.31, 9.3], 1.08, 0.065, M.stone, 48);
cylinder(
  'public art brushed pedestal',
  [-5, 0.61, 9.3],
  0.24,
  0.55,
  M.trim,
  32,
);
for (let meridian = 0; meridian < 8; meridian++)
  for (let segment = 0; segment < 48; segment++) {
    const phi = (meridian / 8) * Math.PI * 2,
      a = (segment / 48) * Math.PI * 2,
      b = ((segment + 1) / 48) * Math.PI * 2,
      P = (t) => [
        -5 + 0.94 * Math.sin(t) * Math.cos(phi),
        1.8 + 0.94 * Math.cos(t),
        9.3 + 0.94 * Math.sin(t) * Math.sin(phi),
      ];
    tube('sculpture blue meridians', P(a), P(b), 0.012, M.blue);
  }
for (const latitude of [-0.65, -0.3, 0, 0.3, 0.65])
  for (let segment = 0; segment < 48; segment++) {
    const r = 0.94 * Math.sqrt(1 - latitude * latitude),
      a = (segment / 48) * Math.PI * 2,
      b = ((segment + 1) / 48) * Math.PI * 2,
      P = (t) => [
        -5 + r * Math.cos(t),
        1.8 + 0.94 * latitude,
        9.3 + r * Math.sin(t),
      ];
    tube('sculpture blue parallels', P(a), P(b), 0.013, M.blue);
  }
// Actual shaped grass blades fill the low garden beds; no opaque green blobs.
for (const side of [-1, 1])
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 11; col++) {
      const x = side * (5.1 + col * 0.56),
        z = 14.5 + row * 0.63,
        jitter = Math.sin(row * 17 + col * 31);
      for (let blade = 0; blade < 4; blade++) {
        const a = blade * 2.4 + jitter,
          w = 0.018,
          height = 0.23 + (jitter + 1) * 0.09,
          tip = [x + Math.cos(a) * 0.16, 0.28 + height, z + Math.sin(a) * 0.16],
          A = [x + Math.cos(a + 1.57) * w, 0.28, z + Math.sin(a + 1.57) * w],
          B = [x - Math.cos(a + 1.57) * w, 0.28, z - Math.sin(a + 1.57) * w];
        quad('layered ornamental grass blades', [A, B, tip, tip], M.grass);
        quad('layered ornamental grass backs', [B, A, tip, tip], M.grass);
      }
    }
// Context landscape with genuinely shaped planted banks beyond the bounded playable site.
const groundY = (x, z) =>
  (z > 22 && z < 35) || (Math.abs(x) < 74 && z < 72 && z > -76)
    ? -0.4
    : -0.45 +
      Math.max(0, Math.abs(x) - 25) * 0.012 +
      1.5 * Math.pow(Math.sin(x * 0.055) * Math.cos(z * 0.043), 2);
for (let x = -100; x < 100; x += 4)
  for (let z = -100; z < 100; z += 4)
    quad(
      'contoured landscape context',
      [
        [x, groundY(x, z + 4), z + 4],
        [x + 4, groundY(x + 4, z + 4), z + 4],
        [x + 4, groundY(x + 4, z), z],
        [x, groundY(x, z), z],
      ],
      M.grass,
      0.22,
    );
const acc = (name, type, a) =>
  d.createAccessor(name).setType(type).setArray(a).setBuffer(buffer);
for (const b of batches.values()) {
  const primitive = d
    .createPrimitive()
    .setAttribute('POSITION', acc('position', 'VEC3', new Float32Array(b.p)))
    .setAttribute('NORMAL', acc('normal', 'VEC3', new Float32Array(b.n)))
    .setAttribute('TEXCOORD_0', acc('uv', 'VEC2', new Float32Array(b.uv)))
    .setAttribute(
      'TANGENT',
      acc('tangent basis', 'VEC4', tangentsFor(b.p, b.n, b.uv, b.i)),
    )
    .setIndices(acc('indices', 'SCALAR', new Uint32Array(b.i)))
    .setMaterial(b.material);
  scene.addChild(
    d.createNode(b.name).setMesh(d.createMesh(b.name).addPrimitive(primitive)),
  );
}
await d.transform(dedup(), weld(), prune());
const bytes = await io.writeBinary(d);
await fs.writeFile('public/assets/g1/site-v3.glb', bytes);
const v = await validator.validateBytes(bytes, {
  uri: 'site-v3.glb',
  writeTimestamp: false,
});
await fs.writeFile(
  'docs/evidence/g1-graphics/environment-validation.json',
  JSON.stringify(v, null, 2) + '\n',
);
assert.equal(v.issues.numErrors, 0);
console.log(
  'Original renovated site',
  bytes.length,
  'bytes;',
  v.issues.numErrors,
  'errors;',
  batches.size,
  'material batches.',
);
