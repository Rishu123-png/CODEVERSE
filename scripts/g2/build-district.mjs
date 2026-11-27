/* global console, Buffer */
// Original G1 renovation. Completed A1 construction/source/evidence stays intact.
import fs from 'node:fs/promises';
import { tangentsFor } from '../g1/geometry-utils.mjs';
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
const ts = await import('typescript');
const layoutSource = await fs.readFile('src/game/districtLayout.ts', 'utf8');
const layoutJS = ts.transpileModule(layoutSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { CITY_BLOCKS, STREET_TREES, STREET_BENCHES } = await import(
  'data:text/javascript;base64,' + Buffer.from(layoutJS).toString('base64')
);
const sharp = (await load('sharp/dist/index.mjs')).default;

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
      0.3 + i * 0.035,
    ])
    .setDoubleSided(true),
);
const bronze = mat('champagne rainscreen cassettes', '#9c8b6e', 0.42, 0.7);
const plaster = mat('interior chalk plaster', '#9b9b91', 0.94);
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
// Original manufactured material studies: mortar joints, brick colour, sawn stone.
const brickSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#706c61"/>${Array.from(
  { length: 16 },
  (_, r) =>
    Array.from({ length: 5 }, (_, c) => {
      const tone = 118 + Math.round(19 * Math.sin(r * 41 + c * 13));
      return `<rect x="${c * 128 - (r % 2) * 64 + 2}" y="${r * 32 + 2}" width="123" height="27" rx="1" fill="rgb(${tone + 30},${tone - 19},${tone - 35})"/>`;
    }).join(''),
).join('')}</svg>`;
const brickImage = await sharp(Buffer.from(brickSvg)).png().toBuffer();
const brickTexture = d
  .createTexture('original fired clay and recessed mortar')
  .setImage(brickImage)
  .setMimeType('image/png');
contextBrick.setBaseColorTexture(brickTexture).setBaseColorFactor([1, 1, 1, 1]);
const chalk = mat('pale ceramic rainscreen', '#d0c7b5', 0.72);
const copper = mat('aged copper standing seams', '#668178', 0.52, 0.65);
const terracotta = mat('terracotta ceramic fins', '#965d44', 0.8);
const clearWindow = mat('deep blue grey vision glass', '#647b82', 0.13, 0);
const darkWindow = mat('recessed shaded window glass', '#263d49', 0.2, 0);
const concrete = mat('board cast warm concrete', '#ada493', 0.92, 0, 'stone');
const fabric = mat('ochre canvas shop awnings', '#977447', 0.95);
const indoorAO = d
  .createTexture('baked room sky visibility approximation')
  .setImage(
    await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: { r: 30, g: 30, b: 30 },
      },
    })
      .png()
      .toBuffer(),
  )
  .setMimeType('image/png');
for (const m of [plaster, carpet, ...roomBacks])
  m.setOcclusionTexture(indoorAO).setOcclusionStrength(1);
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
// Continuous mineral sub-base under joints; no green landscape leaking through.
box(
  'approach continuous mortar bed',
  [0, -0.075, 17.1],
  [4.4, 0.12, 10.2],
  M.riser,
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
const roadAt = (x, z) =>
  Math.abs(z - 28) < 4 ||
  Math.abs(z + 36) < 3.5 ||
  Math.abs(z - 68) < 3.5 ||
  Math.abs(Math.abs(x) - 29) < 3.5;
// Non-overlapping pavement cells: roads actually meet at four-way intersections.
const X = [
  -90, -57, -35.7, -32.5, -25.5, -22.3, -12, 12, 22.3, 25.5, 32.5, 35.7, 57, 90,
];
const Z = [
  -88, -60, -42.7, -39.5, -32.5, -29.3, 0, 12, 22.4, 24, 32, 35.7, 41, 61.5,
  64.5, 71.5, 74.5, 90,
];
for (let i = 0; i < X.length - 1; i++)
  for (let j = 0; j < Z.length - 1; j++) {
    const x = (X[i] + X[i + 1]) / 2,
      z = (Z[j] + Z[j + 1]) / 2,
      w = X[i + 1] - X[i],
      dep = Z[j + 1] - Z[j];
    if (roadAt(x, z))
      box(
        'connected district asphalt cells',
        [x, -0.17, z],
        [w, 0.04, dep],
        M.asphalt,
        0,
        0.32,
      );
    else if (Math.abs(x) < 57 && z > -60 && z < 74.5) {
      if (Math.abs(x) < 22.3 && z >= 0 && z < 22.4) continue;
      box(
        'district sawn pedestrian paving',
        [x, -0.056, z],
        [w, 0.1, dep],
        pavers[(i + j) % 9],
        0,
        0.55,
      );
    }
  }
for (const edge of [-1, 1])
  for (const side of [-1, 1])
    for (let z = -59.5; z < 74; z += 0.9) {
      if (
        Math.abs(z - 28) < 4.4 ||
        Math.abs(z + 36) < 3.9 ||
        Math.abs(z - 68) < 3.9
      )
        continue;
      const x = side * 29 + edge * 3.5;
      box(
        'city individual granite curbs',
        [x, -0.045, z],
        [0.22, 0.21, 0.875],
        M.stone,
      );
    }
for (const zz of [24, 32, -39.5, -32.5, 64.5, 71.5])
  for (let x = -89.5; x < 90; x += 0.9) {
    if (
      Math.abs(Math.abs(x) - 29) < 3.9 ||
      (Math.abs(x) < 1.8 && zz > 23 && zz < 33)
    )
      continue;
    box(
      'city individual granite curbs',
      [x, -0.045, zz],
      [0.875, 0.21, 0.22],
      M.stone,
    );
  }
for (const z of [28, -36, 68])
  for (let x = -88; x < 89; x += 3.5) {
    if (Math.abs(Math.abs(x) - 29) < 7 || (z === 28 && Math.abs(x) < 3))
      continue;
    box(
      'district road center dashes',
      [x, -0.143, z],
      [1.7, 0.009, 0.105],
      M.paint,
    );
  }
for (const x of [-29, 29])
  for (let z = -57; z < 73; z += 3.5) {
    if ([28, -36, 68].some((zz) => Math.abs(z - zz) < 7)) continue;
    box(
      'district road center dashes',
      [x, -0.143, z],
      [0.105, 0.009, 1.7],
      M.paint,
    );
  }
for (const z of [28, -36, 68])
  for (const x of [-29, 29]) {
    for (const side of [-1, 1]) {
      for (let k = -3.3; k < 3.5; k += 0.85) {
        box(
          'intersection zebra east west',
          [x + side * 6.2, -0.138, z + k],
          [2.5, 0.012, 0.4],
          M.paint,
        );
        box(
          'intersection zebra north south',
          [x + k, -0.138, z + side * 6.0],
          [0.4, 0.012, 2.4],
          M.paint,
        );
      }
      box(
        'intersection stop line',
        [x + side * 8.1, -0.137, z + side * 1.9],
        [0.15, 0.013, 3.4],
        M.paint,
      );
    }
  }
for (let z = 24.35; z < 32; z += 0.85)
  box('central crossing stripes', [0, -0.137, z], [2.8, 0.012, 0.42], M.paint);
for (const x of [-29, 29])
  for (const z of [-34.5, 26.5, 66.5]) {
    box(
      'intersection drainage frame',
      [x + 3.2, -0.129, z],
      [0.28, 0.025, 0.8],
      M.dark,
    );
    for (let i = 0; i < 8; i++)
      box(
        'cast drain grate slots',
        [x + 3.2, -0.111, z - 0.33 + i * 0.09],
        [0.25, 0.013, 0.022],
        M.steel,
      );
  }
for (const x of [-44, 44]) {
  box('pocket garden stone border', [x, 0.08, 13], [17.7, 0.24, 17.7], M.riser);
  box(
    'pocket garden lawn',
    [x, 0.205, 13],
    [17.2, 0.02, 17.2],
    M.grass,
    0,
    0.18,
  );
  box(
    'pocket garden promenade',
    [x, 0.22, 13],
    [2.7, 0.025, 17.4],
    pavers[2],
    0,
    0.7,
  );
  box(
    'pocket garden cross axis',
    [x, 0.22, 15],
    [17.4, 0.025, 2.7],
    pavers[3],
    0,
    0.7,
  );
  for (let i = 0; i < 180; i++) {
    const xx = x + Math.sin(i * 15.3) * 7.7,
      zz = 13 + Math.cos(i * 27.1) * 7.7;
    if (Math.abs(xx - x) < 1.6 || Math.abs(zz - 15) < 1.6) continue;
    for (let k = 0; k < 5; k++) {
      const a = k * 2.4 + i,
        dx = Math.cos(a) * 0.035,
        dz = Math.sin(a) * 0.035,
        h = 0.1 + (0.5 + 0.5 * Math.sin(i * 11)) * 0.13;
      const p = [xx + 0.15 * Math.cos(a), 0.23 + h, zz + 0.15 * Math.sin(a)];
      quad(
        'natural park grass tufts',
        [[xx - dx, 0.22, zz - dz], [xx + dx, 0.22, zz + dz], p, p],
        M.grass,
      );
    }
  }
}
const water = mat('still garden basin water', '#304e50', 0.075, 0);
box('arts garden basin stone', [44, 0.28, 9], [6.4, 0.28, 5.8], M.stone);
box('arts garden basin water', [44, 0.43, 9], [5.8, 0.025, 5.2], water);
for (const [x, z] of STREET_TREES) {
  box('street tree granite setting', [x, 0.025, z], [2.1, 0.06, 2.1], M.riser);
  box('street tree porous grate', [x, 0.06, z], [1.9, 0.015, 1.9], M.dark);
  for (let j = -4; j <= 4; j++)
    box(
      'street tree radial grate bars',
      [x + j * 0.2, 0.075, z],
      [0.035, 0.015, 1.9],
      M.steel,
    );
}
for (const [x, z] of STREET_BENCHES) bench(x, z);
function cityLight(x, z, dx, dz) {
  cylinder('district light anchor', [x, 0.1, z], 0.13, 0.2, M.dark);
  cylinder('district slender light poles', [x, 2.7, z], 0.048, 5.4, M.dark);
  box(
    'district light cantilevers',
    [x + dx * 0.65, 5.35, z + dz * 0.65],
    [dx ? 1.4 : 0.09, 0.09, dz ? 1.4 : 0.09],
    M.dark,
  );
  box(
    'district light housing',
    [x + dx * 1.1, 5.3, z + dz * 1.1],
    [dx ? 0.8 : 0.28, 0.08, dz ? 0.8 : 0.28],
    M.dark,
  );
  box(
    'district light diffuser',
    [x + dx * 1.1, 5.25, z + dz * 1.1],
    [dx ? 0.7 : 0.22, 0.02, dz ? 0.7 : 0.22],
    M.warm,
  );
}
for (const side of [-1, 1])
  for (const z of [-49, -22, -3, 17, 46, 62])
    cityLight(side * 35.2, z, -side, 0);
for (const z of [-30.1, 35.0, 73])
  for (const x of [-50, -17, 17, 50]) cityLight(x, z, 0, z < 0 ? -1 : 1);
// Believable bounded construction/rail edges, not an unmarked invisible rectangle.
for (const side of [-1, 1]) {
  for (let z = -59; z < 74; z += 2.4) {
    if (Math.abs(z - 28) < 4.2) continue;
    box(
      'district garden boundary brick base',
      [side * 57.5, 0.3, z],
      [0.34, 0.6, 2.4],
      contextBrick,
    );
    box(
      'district boundary iron railing',
      [side * 57.5, 1.05, z],
      [0.04, 0.045, 2.4],
      M.dark,
    );
    for (let j = 0; j < 6; j++)
      box(
        'district boundary vertical pickets',
        [side * 57.5, 0.86, z - 1.0 + j * 0.4],
        [0.035, 0.95, 0.035],
        M.dark,
      );
  }
  for (const z of [-60.5, 74.5])
    for (let x = -56.5; x < 57; x += 2.4) {
      box(
        'district edge brick garden wall',
        [x, 0.48, z],
        [2.4, 0.96, 0.32],
        contextBrick,
      );
      box(
        'district edge wall stone coping',
        [x, 0.99, z],
        [2.4, 0.08, 0.44],
        M.stone,
      );
    }
  for (const x of [-29, 29])
    for (const z of [-59.4, 73.4]) {
      for (let j = -3; j <= 3; j++)
        box(
          'road works concrete gate',
          [x + j, 0.6, z],
          [0.94, 1.2, 0.38],
          j % 2 ? M.paint : terracotta,
        );
    }
  for (let j = -3; j <= 3; j++)
    box(
      'works at undeveloped avenue end',
      [side * 56.4, 0.55, 28 + j],
      [0.4, 1.1, 0.94],
      j % 2 ? M.paint : terracotta,
    );
}

function elevation(label, x, z, w, d, h, skin, style) {
  const floorH = style === 'library' ? 3.8 : 3.3;
  const n = Math.max(1, Math.floor(h / floorH)),
    bay = style === 'library' ? 3.7 : style === 'brick' ? 2.2 : 2.8;
  box(
    label + ' shaded interior core',
    [x, h / 2, z],
    [w - 1.1, h, d - 1.1],
    M.dark,
  );
  for (const axis of [0, 1]) {
    const span = axis === 0 ? w : d,
      count = Math.max(2, Math.round(span / bay)),
      pitch = span / count;
    for (const side of [-1, 1]) {
      const face = axis === 0 ? z + (side * d) / 2 : x + (side * w) / 2;
      for (let f = 0; f < n; f++) {
        const y = (f * h) / n,
          H = h / n;
        const at = (u, Y, offset = 0) =>
          axis === 0
            ? [x + u, Y, face + side * offset]
            : [face + side * offset, Y, z + u];
        const dim = (W, H, D) => (axis === 0 ? [W, H, D] : [D, H, W]);
        box(
          label + ' floor stone belt',
          at(0, y + 0.22),
          dim(span, 0.44, 0.5),
          skin,
        );
        for (let j = 0; j < count; j++) {
          const u = -span / 2 + (j + 0.5) * pitch,
            winW =
              pitch *
              (style === 'library' ? 0.8 : style === 'brick' ? 0.55 : 0.64);
          box(
            label + ' facade piers',
            at(-span / 2 + j * pitch, y + H / 2, 0.08),
            dim(pitch - winW, H, 0.48),
            skin,
          );
          box(
            label + ' deeply recessed vision panel',
            at(u, y + H * 0.53, -0.17),
            dim(winW, H * 0.65, 0.055),
            (f + j) % 4 === 0 ? darkWindow : clearWindow,
          );
          box(
            label + ' window sill',
            at(u, y + 0.48, 0.16),
            dim(winW + 0.13, 0.09, 0.5),
            M.stone,
          );
          box(
            label + ' window head',
            at(u, y + H - 0.21),
            dim(winW + 0.12, 0.38, 0.45),
            skin,
          );
          box(
            label + ' fine metal mullion',
            at(u, y + H * 0.53, -0.1),
            dim(0.035, H * 0.65, 0.065),
            M.trim,
          );
        }
      }
      box(
        label + ' corner return',
        axis === 0
          ? [x + span / 2 - 0.12, h / 2, face]
          : [face, h / 2, z + span / 2 - 0.12],
        axis === 0 ? [0.24, h, 0.55] : [0.55, h, 0.24],
        skin,
      );
    }
  }
  box(
    label + ' roof edge coping',
    [x, h + 0.1, z],
    [w + 0.3, 0.2, d + 0.3],
    skin,
  );
}
function door(label, x, z, w = 2.1) {
  box(
    label + ' recessed shop portal',
    [x, 1.6, z],
    [w + 0.5, 3.2, 0.42],
    M.dark,
  );
  for (const dx of [-0.25, 0.25]) {
    box(
      label + ' entrance glass',
      [x + dx * w, 1.5, z + 0.24],
      [w * 0.48, 2.85, 0.04],
      clearWindow,
    );
    box(
      label + ' door pull',
      [x + dx * 0.5, 1.3, z + 0.33],
      [0.025, 0.65, 0.035],
      M.trim,
    );
  }
  box(label + ' transom', [x, 3.05, z + 0.27], [w, 0.045, 0.06], M.trim);
}
function vault(label, x, z, w, d, y) {
  for (let j = 0; j < 20; j++) {
    const a = (j * Math.PI) / 20,
      b = ((j + 1) * Math.PI) / 20;
    quad(
      label + ' vaulted glass roof',
      [
        [x + (w / 2) * Math.cos(a), y + 3.2 * Math.sin(a), z - d / 2],
        [x + (w / 2) * Math.cos(b), y + 3.2 * Math.sin(b), z - d / 2],
        [x + (w / 2) * Math.cos(b), y + 3.2 * Math.sin(b), z + d / 2],
        [x + (w / 2) * Math.cos(a), y + 3.2 * Math.sin(a), z + d / 2],
      ],
      clearWindow,
    );
    for (const zz of [z - d / 2, z, z + d / 2])
      tube(
        label + ' curved roof ribs',
        [x + (w / 2) * Math.cos(a), y + 3.2 * Math.sin(a), zz],
        [x + (w / 2) * Math.cos(b), y + 3.2 * Math.sin(b), zz],
        0.055,
        M.trim,
      );
  }
}
for (const p of CITY_BLOCKS) {
  const { id, x, z, w, d, h, style } = p;
  box(id + ' apron', [x, -0.065, z], [w + 4, 0.12, d + 4], pavers[3], 0, 0.8);
  if (style === 'arcade') {
    elevation(id, x, z, w, d, h, contextBrick, 'brick');
    // Deep stone colonnade around actual recessed shop-front entrances.
    for (let u = -w / 2 + 1.6; u < w / 2; u += 3) {
      door(id, x + u, z + d / 2 + 0.02, 2.1);
      for (let j = 0; j < 10; j++) {
        const a = (j * Math.PI) / 10,
          b = ((j + 1) * Math.PI) / 10;
        quad(
          id + ' voussoir stone arches',
          [
            [
              x + u + 1.45 * Math.cos(a),
              2.6 + 1.45 * Math.sin(a),
              z + d / 2 + 0.5,
            ],
            [
              x + u + 1.45 * Math.cos(b),
              2.6 + 1.45 * Math.sin(b),
              z + d / 2 + 0.5,
            ],
            [
              x + u + 1.18 * Math.cos(b),
              2.6 + 1.18 * Math.sin(b),
              z + d / 2 + 0.5,
            ],
            [
              x + u + 1.18 * Math.cos(a),
              2.6 + 1.18 * Math.sin(a),
              z + d / 2 + 0.5,
            ],
          ],
          M.stone,
        );
      }
      box(
        id + ' arcade columns',
        [x + u - 1.45, 1.4, z + d / 2 + 0.44],
        [0.28, 2.8, 0.7],
        M.stone,
      );
    }
    box(
      id + ' heavy cornice',
      [x, h + 0.42, z],
      [w + 0.6, 0.35, d + 0.6],
      M.stone,
    );
    box(
      id + ' recessed upper pavilion',
      [x - 1, h + 1.8, z - 2],
      [w - 4, 2.5, d - 7],
      contextBrick,
    );
  } else if (style === 'sawtooth') {
    box(id + ' masonry plinth', [x, 1, z], [w, 2, d], contextBrick);
    box(
      id + ' dark exhibition interior',
      [x, 6.5, z],
      [w - 0.8, 11, d - 0.8],
      M.dark,
    );
    for (const side of [-1, 1])
      for (let u = -w / 2; u <= w / 2; u += 1.5) {
        box(
          id + ' double height glazing',
          [x + u, 7, z + side * (d / 2 - 0.12)],
          [1.35, 10, 0.06],
          clearWindow,
        );
        box(
          id + ' copper sun fins',
          [x + u, 7, z + side * (d / 2 + 0.12)],
          [0.11, 10.3, 0.7],
          copper,
        );
      }
    // Finish the long street-facing elevations too: the recessed dark interior
    // is not an acceptable exposed black facade from the plaza approach.
    for (const side of [-1, 1]) {
      for (let bay = 0; bay < 9; bay++) {
        const zz = z - d / 2 + ((bay + 0.5) * d) / 9;
        box(
          id + ' side exhibition glazing',
          [x + side * (w / 2 + 0.02), 6.85, zz],
          [0.08, 8.9, d / 9 - 0.22],
          bay % 3 === 0 ? darkWindow : clearWindow,
        );
        box(
          id + ' side ceramic piers',
          [x + side * (w / 2 + 0.13), 7, zz - d / 18],
          [0.32, 10.2, 0.2],
          concrete,
        );
        box(
          id + ' projecting copper side fins',
          [x + side * (w / 2 + 0.35), 7, zz - d / 18],
          [0.65, 10.2, 0.08],
          copper,
        );
        box(
          id + ' side window transoms',
          [x + side * (w / 2 + 0.1), 6.7, zz],
          [0.15, 0.075, d / 9 - 0.2],
          M.trim,
        );
      }
      box(
        id + ' side coping course',
        [x + side * (w / 2 + 0.13), 11.7, z],
        [0.45, 0.45, d + 0.15],
        copper,
      );
      box(
        id + ' side lower stone sill',
        [x + side * (w / 2 + 0.14), 2.28, z],
        [0.5, 0.25, d + 0.1],
        M.stone,
      );
    }
    for (let zz = z - d / 2; zz < z + d / 2; zz += 4.33) {
      quad(
        id + ' folded copper roof',
        [
          [x - w / 2, 12, zz],
          [x + w / 2, 12, zz],
          [x + w / 2, 13.6, zz + 3.4],
          [x - w / 2, 13.6, zz + 3.4],
        ],
        copper,
      );
      quad(
        id + ' northlight roof glazing',
        [
          [x - w / 2, 13.6, zz + 3.4],
          [x + w / 2, 13.6, zz + 3.4],
          [x + w / 2, 12, zz + 4.33],
          [x - w / 2, 12, zz + 4.33],
        ],
        clearWindow,
      );
      for (let xx = x - w / 2; xx <= x + w / 2; xx += 1.2)
        tube(
          id + ' standing roof seams',
          [xx, 12.03, zz],
          [xx, 13.63, zz + 3.4],
          0.018,
          M.trim,
        );
    }
    door(id, x, z + d / 2 + 0.2, 3.1);
    box(
      id + ' floating entrance canopy',
      [x, 3.6, z + d / 2 + 1.2],
      [6.2, 0.18, 2.7],
      copper,
    );
  } else if (style === 'terrace') {
    elevation(id, x, z, w, d, 18, chalk, 'terrace');

    // Move the upper pavilion above the occupied block, not a duplicate silhouette.
    box(id + ' penthouse setback', [x, 20.5, z], [w - 4, 5, d - 4], chalk);
    for (const side of [-1, 1])
      for (let f = 1; f < 6; f++)
        for (const u of [-5.3, 1.6]) {
          box(
            id + ' cantilever balconies',
            [x + u, f * 3.15, z + side * (d / 2 + 0.65)],
            [5.8, 0.16, 1.5],
            concrete,
          );
          box(
            id + ' bronze top rail',
            [x + u, f * 3.15 + 0.99, z + side * (d / 2 + 1.3)],
            [5.8, 0.045, 0.045],
            M.trim,
          );
          for (let k = 0; k < 14; k++)
            box(
              id + ' balcony balusters',
              [
                x + u - 2.7 + k * 0.42,
                f * 3.15 + 0.54,
                z + side * (d / 2 + 1.3),
              ],
              [0.025, 0.88, 0.035],
              M.dark,
            );
        }
    for (let u = -w / 2 + 1; u < w / 2; u += 2.1)
      box(
        id + ' roof garden planter',
        [x + u, 18.35, z + d / 2 - 0.5],
        [1.8, 0.5, 0.8],
        terracotta,
      );
    door(id, x, z - d / 2 - 0.3, 2.4);
  } else if (style === 'atrium') {
    box(id + ' polished stone podium', [x, 0.35, z], [w, 0.7, d], concrete);
    for (const side of [-1, 1])
      for (let u = -w / 2; u <= w / 2; u += 1.5) {
        box(
          id + ' open atrium glazing',
          [x + u, 6.7, z + (side * d) / 2],
          [1.42, 12, 0.055],
          glass[2],
        );
        box(
          id + ' full height structural ribs',
          [x + u, 6.7, z + side * (d / 2 + 0.1)],
          [0.12, 12, 0.24],
          M.trim,
        );
      }
    for (const side of [-1, 1])
      box(
        id + ' side stone blade',
        [x + (side * w) / 2, 6.7, z],
        [0.6, 12, d],
        M.stone,
      );
    vault(id, x, z, w, d, 12.7);
    for (const y of [4.5, 8.5])
      box(
        id + ' interior gallery floor',
        [x, y, z],
        [w - 0.8, 0.2, 3],
        concrete,
      );
    for (const u of [-6, 6]) {
      box(
        id + ' internal garden beds',
        [x + u, 0.7, z],
        [3.8, 0.7, 12],
        terracotta,
      );
      box(id + ' garden soil', [x + u, 1.06, z], [3.4, 0.03, 11.6], M.soil);
    }
    door(id, x, z - d / 2 - 0.1, 3);
  } else if (style === 'library') {
    elevation(id, x, z, w, d, h, concrete, 'library');
    for (const side of [-1, 1])
      for (let u = -w / 2; u <= w / 2; u += 0.8)
        box(
          id + ' vertical timber brise soleil',
          [x + u, h / 2, z + side * (d / 2 + 0.45)],
          [0.1, h - 0.3, 0.65],
          M.wood,
        );
    box(
      id + ' overhanging roof',
      [x, h + 0.38, z],
      [w + 1.5, 0.32, d + 1.5],
      concrete,
    );
    box(
      id + ' glazed roof lantern',
      [x, h + 1.2, z],
      [w * 0.5, 1.5, d * 0.45],
      clearWindow,
    );
    door(id, x, z + d / 2 + 0.3, 3);
  } else if (style === 'tower') {
    elevation(id + ' podium', x, z, w, d, 8, slate, 'library');
    for (const [Y, H, W, D] of [
      [8, 14, w - 2, d - 2],
      [22, 9, w - 5, d - 4],
      [31, 4, w - 7, d - 6],
    ]) {
      box(
        id + ' glass lantern tier',
        [x, Y + H / 2, z],
        [W, H, D],
        clearWindow,
      );
      for (let u = -W / 2; u <= W / 2; u += 1.35)
        for (const side of [-1, 1])
          box(
            id + ' ceramic vertical fins',
            [x + u, Y + H / 2, z + side * (D / 2 + 0.12)],
            [0.13, H, 0.34],
            chalk,
          );
      for (let u = -D / 2; u <= D / 2; u += 1.35)
        for (const side of [-1, 1])
          box(
            id + ' ceramic side fins',
            [x + side * (W / 2 + 0.12), Y + H / 2, z + u],
            [0.34, H, 0.13],
            chalk,
          );
      box(
        id + ' tier setback coping',
        [x, Y + H + 0.12, z],
        [W + 0.4, 0.24, D + 0.4],
        M.trim,
      );
    }
    box(id + ' crown mast', [x, h + 1.5, z], [0.16, 3, 0.16], M.trim);
    door(id, x, z + d / 2 + 0.2, 2.4);
  } else if (style === 'gable') {
    elevation(id, x, z, w, d, 10, contextBrick, 'library');
    for (let i = 0; i < 3; i++) {
      const xx = x - w / 2 + ((i + 0.5) * w) / 3,
        half = w / 6;
      quad(
        id + ' pitched zinc roofs',
        [
          [xx - half, 10.2, z - d / 2],
          [xx - half, 10.2, z + d / 2],
          [xx, 15, z + d / 2],
          [xx, 15, z - d / 2],
        ],
        M.dark,
      );
      quad(
        id + ' pitched zinc roofs',
        [
          [xx, 15, z - d / 2],
          [xx, 15, z + d / 2],
          [xx + half, 10.2, z + d / 2],
          [xx + half, 10.2, z - d / 2],
        ],
        M.dark,
      );
      for (const side of [-1, 1]) {
        quad(
          id + ' brick gable ends',
          [
            [xx - half, 10, z + (side * d) / 2],
            [xx + half, 10, z + (side * d) / 2],
            [xx, 15, z + (side * d) / 2],
            [xx, 15, z + (side * d) / 2],
          ],
          contextBrick,
        );
        box(
          id + ' loft slit windows',
          [xx, 11.7, z + side * (d / 2 + 0.04)],
          [1, 2.4, 0.055],
          darkWindow,
        );
      }
      door(id, x + (i - 1) * 5.5, z - d / 2 - 0.2, 3.6);
      quad(
        id + ' canvas shop awnings',
        [
          [xx - 2, 3.4, z - d / 2 - 0.1],
          [xx + 2, 3.4, z - d / 2 - 0.1],
          [xx + 2, 2.9, z - d / 2 - 1.6],
          [xx - 2, 2.9, z - d / 2 - 1.6],
        ],
        fabric,
      );
    }
  } else {
    elevation(id, x, z, w, d, h, contextBrick, 'brick');
    for (const side of [-1, 1])
      for (let u = -w / 2 + 1; u < w / 2; u += 4.4)
        box(
          id + ' paired bay terracotta surrounds',
          [x + u, h / 2, z + side * (d / 2 + 0.3)],
          [0.16, h, 0.6],
          terracotta,
        );
    cylinder(
      id + ' rounded brick corner tower',
      [x - w / 2 + 1.5, h / 2 + 0.8, z - d / 2 + 1.5],
      2.05,
      h + 1.6,
      contextBrick,
      24,
    );
    cylinder(
      id + ' copper tower cornice',
      [x - w / 2 + 1.5, h + 1.7, z - d / 2 + 1.5],
      2.22,
      0.25,
      copper,
      24,
    );
    box(
      id + ' rooftop pavilion',
      [x + 2, h + 1, z],
      [w * 0.5, 2, d * 0.6],
      terracotta,
    );
    door(id, x + 1, z - d / 2 - 0.3, 2.3);
  }
}
// Distant continuation with distinct stepped/vertical skyline masses, not an identical wall.
for (const [i, x, z, w, dep, h] of [
  [0, -74, -45, 18, 22, 34],
  [1, 73, -47, 17, 22, 44],
  [2, -10, -83, 21, 20, 52],
  [3, 19, -78, 14, 19, 34],
  [4, -76, 50, 19, 24, 20],
  [5, 75, 51, 21, 22, 27],
  [6, -15, 92, 24, 18, 23],
  [7, 20, 94, 15, 20, 37],
]) {
  box(
    'distant continuation plinth',
    [x, -0.06, z],
    [w + 3, 0.12, dep + 3],
    pavers[3],
  );
  box(
    'distant individual skyline mass',
    [x, h / 2, z],
    [w, h, dep],
    i % 2 ? chalk : contextBrick,
  );
  for (let f = 1; f < h / 3; f++)
    for (const side of [-1, 1])
      box(
        'distant ribbon window courses',
        [x, f * 3, z + side * (dep / 2 + 0.02)],
        [w - 1, 1.25, 0.04],
        darkWindow,
      );
  for (const side of [-1, 1])
    for (let f = 1; f < h / 3; f++)
      for (let zz = -dep / 2 + 1.5; zz < dep / 2 - 0.5; zz += 2.4)
        box(
          'distant side recessed windows',
          [x + side * (w / 2 + 0.03), f * 3, z + zz],
          [0.05, 1.5, 1.4],
          (f + i) % 3 ? darkWindow : clearWindow,
        );
  if (i % 2 === 0)
    box(
      'distant stepped upper pavilion',
      [x + 2, h + 3, z],
      [w * 0.65, 6, dep * 0.7],
      concrete,
    );
  else
    for (let u = -w / 2; u < w / 2; u += 1.8)
      for (const side of [-1, 1])
        box(
          'distant vertical silhouette fins',
          [x + u, h / 2, z + side * (dep / 2 + 0.12)],
          [0.12, h, 0.3],
          M.trim,
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
await fs.writeFile('.cache/g3/site-district.glb', bytes);
const v = await validator.validateBytes(bytes, {
  uri: 'site-v3.glb',
  writeTimestamp: false,
});
await fs.writeFile(
  '.cache/g3/environment-validation.json',
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
