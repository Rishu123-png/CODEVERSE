/* global console */
// Full exterior/site construction proof. Original parameterized source, not final art.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base = path.resolve('.cache/a1/tools/node_modules');
const load = (p) => import(pathToFileURL(path.join(base, p)).href);
const { Document, NodeIO } = await load('@gltf-transform/core/dist/index.js');
const { ALL_EXTENSIONS } = await load(
  '@gltf-transform/extensions/dist/index.js',
);
const { dedup, weld, prune, meshopt } = await load(
  '@gltf-transform/functions/dist/index.js',
);
const { MeshoptEncoder, MeshoptDecoder } = await load('meshoptimizer/index.js');
const validator = await load('gltf-validator/index.js');
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const cfg = JSON.parse(
  await fs.readFile('scripts/a1/landmark-study.json', 'utf8'),
);
const B = cfg.building,
  S = cfg.site;
assert.equal(
  B.arcSegments,
  B.frontBays * 6,
  'This recipe requires six tessellation steps per front bay',
);
assert.equal(
  S.forecourtDepth,
  12,
  'Link placement is currently authored for the 12m forecourt',
);
assert.equal(
  S.linkLength,
  12,
  'Link placement is currently authored for a 12m connection',
);
assert.equal(
  S.coreWidth,
  42,
  'Site bounds assertions require the reviewed 42m width',
);
const out = '.cache/a1-runtime/generated',
  evidence = 'docs/evidence/a1-runtime';
await fs.mkdir(out, { recursive: true });
await fs.mkdir(evidence, { recursive: true });
const sha = (b) => createHash('sha256').update(b).digest('hex');
function build() {
  const d = new Document(),
    buffer = d.createBuffer(),
    scene = d.createScene(
      'Original CodeVerse full-exterior construction study',
    );
  d.getRoot().setDefaultScene(scene);
  d.getRoot().getAsset().copyright =
    'Original CodeVerse A1 construction study; not production art';
  const material = (name, color, metal = 0, rough = 0.7) =>
    d
      .createMaterial(name)
      .setBaseColorFactor(color)
      .setMetallicFactor(metal)
      .setRoughnessFactor(rough);
  const mats = {
    stone: material('original pale architectural bands', [0.48, 0.52, 0.55, 1]),
    glass: material(
      'opaque blue-neutral glazing STUDY',
      [0.07, 0.16, 0.22, 1],
      0.45,
      0.25,
    ),
    metal: material('neutral structural metal', [0.1, 0.14, 0.18, 1], 0.7, 0.4),
    blue: material(
      'blue accent study',
      [0.02, 0.24, 0.65, 1],
      0.2,
      0.4,
    ).setEmissiveFactor([0.005, 0.025, 0.06]),
    paving: material('original pale slab scalar study', [0.38, 0.41, 0.43, 1]),
    asphalt: material(
      'original asphalt scalar study',
      [0.075, 0.085, 0.09, 1],
      0,
      0.93,
    ),
    wood: material('bench wood scalar study', [0.26, 0.14, 0.075, 1]),
    soil: material('soil scalar study', [0.075, 0.055, 0.04, 1]),
    marking: material('road marking scalar study', [0.65, 0.65, 0.6, 1]),
  };
  const groups = new Map(),
    parts = [];
  function add(zone, name, quads, mat, smoothNormals = null) {
    const key = zone + ':' + mat,
      g = groups.get(key) || { zone, mat, p: [], n: [], uv: [], i: [] };
    groups.set(key, g);
    const points = [];
    quads.forEach((q, qi) => {
      const index = g.p.length / 3,
        u = q[1].map((x, i) => x - q[0][i]),
        v = q[2].map((x, i) => x - q[0][i]);
      const n = [
          u[1] * v[2] - u[2] * v[1],
          u[2] * v[0] - u[0] * v[2],
          u[0] * v[1] - u[1] * v[0],
        ],
        len = Math.hypot(...n);
      assert(len > 1e-10, name);
      q.forEach((p, j) => {
        g.p.push(...p);
        g.n.push(...(smoothNormals?.[qi]?.[j] || n.map((x) => x / len)));
        points.push(p);
      });
      g.uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      g.i.push(index, index + 1, index + 2, index, index + 2, index + 3);
    });
    parts.push({
      zone,
      name,
      material: mat,
      bounds: [0, 1, 2].map((a) => [
        Math.min(...points.map((p) => p[a])),
        Math.max(...points.map((p) => p[a])),
      ]),
    });
  }
  function box(zone, name, lo, hi, mat, angle = 0) {
    const [x, y, z] = lo,
      [X, Y, Z] = hi,
      center = [(x + X) / 2, (z + Z) / 2];
    const qs = [
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
    ];
    if (angle)
      for (const q of qs)
        for (const p of q) {
          const a = p[0] - center[0],
            b = p[2] - center[1];
          p[0] = center[0] + a * Math.cos(angle) + b * Math.sin(angle);
          p[2] = center[1] - a * Math.sin(angle) + b * Math.cos(angle);
        }
    add(zone, name, qs, mat);
  }
  const half = (B.frontArcDegrees * Math.PI) / 360,
    R = B.frontRadius;
  const pt = (r, a, y) => [r * Math.sin(a), y, r * Math.cos(a) - R];
  const width = 2 * R * Math.sin(half),
    sideZ = R * Math.cos(half) - R,
    w = width / 2;
  function arcBand(name, y, height, r0 = R - 0.18, r1 = R + 0.24) {
    const qs = [],
      ns = [];
    for (let i = 0; i < B.arcSegments; i++) {
      const a = -half + (2 * half * i) / B.arcSegments,
        b = -half + (2 * half * (i + 1)) / B.arcSegments;
      qs.push([
        pt(r1, a, y),
        pt(r1, b, y),
        pt(r1, b, y + height),
        pt(r1, a, y + height),
      ]);
      ns.push([
        [Math.sin(a), 0, Math.cos(a)],
        [Math.sin(b), 0, Math.cos(b)],
        [Math.sin(b), 0, Math.cos(b)],
        [Math.sin(a), 0, Math.cos(a)],
      ]);
      qs.push([
        pt(r0, a, y + height),
        pt(r1, a, y + height),
        pt(r1, b, y + height),
        pt(r0, b, y + height),
      ]);
      ns.push(null);
      qs.push([pt(r0, b, y), pt(r1, b, y), pt(r1, a, y), pt(r0, a, y)]);
      ns.push(null);
    }
    add('front', name, qs, 'stone', ns);
  }
  const levels = [0, B.groundHeight];
  for (let i = 1; i <= B.upperFloors; i++)
    levels.push(B.groundHeight + i * B.upperFloorHeight);
  const roof = levels.at(-1),
    top = roof + B.parapetHeight;
  for (const y of levels) {
    arcBand('curved-band-' + y, y, 0.22);
    box(
      'left',
      'band-' + y,
      [-w - 0.24, y, B.rearZ - 0.24],
      [-w + 0.18, y + 0.22, sideZ],
      'stone',
    );
    box(
      'right',
      'band-' + y,
      [w - 0.18, y, B.rearZ - 0.24],
      [w + 0.24, y + 0.22, sideZ],
      'stone',
    );
    box(
      'rear',
      'band-' + y,
      [-w, y, B.rearZ - 0.24],
      [w, y + 0.22, B.rearZ + 0.18],
      'stone',
    );
  }
  for (let floor = 0; floor < levels.length - 1; floor++) {
    const y0 = levels[floor] + 0.22,
      y1 = levels[floor + 1];
    for (let bay = 0; bay < B.frontBays; bay++) {
      const a = -half + (2 * half * bay) / B.frontBays,
        b = -half + (2 * half * (bay + 1)) / B.frontBays;
      if (
        floor === 0 &&
        Math.abs((a + b) / 2) < (B.entranceHalfAngleDegrees * Math.PI) / 180
      )
        continue;
      const qs = [],
        ns = [];
      for (let s = 0; s < 6; s++) {
        const aa = a + ((b - a) * s) / 6,
          bb = a + ((b - a) * (s + 1)) / 6;
        qs.push([
          pt(R, aa, y0 + 0.12),
          pt(R, bb, y0 + 0.12),
          pt(R, bb, y1 - 0.14),
          pt(R, aa, y1 - 0.14),
        ]);
        ns.push([
          [Math.sin(aa), 0, Math.cos(aa)],
          [Math.sin(bb), 0, Math.cos(bb)],
          [Math.sin(bb), 0, Math.cos(bb)],
          [Math.sin(aa), 0, Math.cos(aa)],
        ]);
      }
      add('front', 'glazing-floor-' + floor + '-bay-' + bay, qs, 'glass', ns);
    }
    for (let bay = 0; bay <= B.frontBays; bay++) {
      const a = -half + (2 * half * bay) / B.frontBays;
      if (
        floor === 0 &&
        Math.abs(a) < (B.entranceHalfAngleDegrees * Math.PI) / 180 - 0.001
      )
        continue;
      const [x, , z] = pt(R, a, 0);
      box(
        'front',
        'mullion-' + floor + '-' + bay,
        [x - 0.045, y0, z - 0.07],
        [x + 0.045, y1, z + 0.07],
        'metal',
        a,
      );
    }
    for (const [zone, x, sign] of [
      ['left', -w, -1],
      ['right', w, 1],
    ]) {
      const count = 9,
        depth = sideZ - B.rearZ;
      for (let bay = 0; bay < count; bay++) {
        const z0 = B.rearZ + (depth * bay) / count + 0.08,
          z1 = B.rearZ + (depth * (bay + 1)) / count - 0.08;
        box(
          zone,
          'recessed-bay-' + floor + '-' + bay,
          [x - 0.055, y0 + 0.2, z0],
          [x + 0.055, y1 - 0.2, z1],
          'glass',
        );
        box(
          zone,
          'bay-post-' + floor + '-' + bay,
          [x - 0.14, y0, z0 - 0.08],
          [x + 0.14, y1, z0 + 0.01],
          'metal',
        );
      }
      box(
        zone,
        'opaque-spandrel-' + floor,
        [x - 0.09, y0, B.rearZ],
        [x + 0.09, y0 + 0.2, sideZ],
        'stone',
      );
      // sign records orientation semantics for future art-facing module extraction.
      assert(Math.abs(sign) === 1);
    }
    for (let bay = 0; bay < 12; bay++) {
      const x0 = -w + (width * bay) / 12 + 0.08,
        x1 = -w + (width * (bay + 1)) / 12 - 0.08;
      box(
        'rear',
        'service-facade-bay-' + floor + '-' + bay,
        [x0, y0 + 0.2, B.rearZ - 0.06],
        [x1, y1 - 0.2, B.rearZ + 0.06],
        'glass',
      );
      box(
        'rear',
        'post-' + floor + '-' + bay,
        [x0 - 0.08, y0, B.rearZ - 0.15],
        [x0, y1, B.rearZ + 0.15],
        'metal',
      );
    }
  }
  // Layered original entry: recessed frame/doors, structural returns and canopy.
  box('entry', 'landing', [-4.5, -0.16, -2], [4.5, 0, 1.8], 'stone');
  box(
    'entry',
    'door-pair',
    [-2.3, 0, -B.entranceRecess - 0.1],
    [2.3, 3.2, -B.entranceRecess],
    'glass',
  );
  for (const x of [-2.4, 0, 2.4])
    box(
      'entry',
      'door-frame-' + x,
      [x - 0.055, 0, -B.entranceRecess - 0.16],
      [x + 0.055, 3.3, -B.entranceRecess + 0.06],
      'metal',
    );
  for (const x of [-3.8, 3.8])
    box(
      'entry',
      'column-' + x,
      [x - 0.16, 0, -0.9],
      [x + 0.16, 4.55, -0.58],
      'stone',
    );
  box('entry', 'canopy', [-4.7, 3.65, -1.65], [4.7, 3.92, 1.7], 'metal');
  box('entry', 'canopy-blue-edge', [-4.7, 3.92, 1.57], [4.7, 4.0, 1.7], 'blue');
  box(
    'entry',
    'sign-support-NO-final-logo',
    [-3.3, 4.0, -0.55],
    [3.3, 4.55, -0.35],
    'metal',
  );
  box(
    'rear',
    'service-door',
    [-1.0, 0, B.rearZ - 0.19],
    [1.0, 2.5, B.rearZ - 0.16],
    'metal',
  );
  // Roof is a closed convex footprint, not an unfinished backless facade.
  const perimeter = [
    [-w, roof, B.rearZ],
    [w, roof, B.rearZ],
    [w, roof, sideZ],
  ];
  for (let i = 1; i <= B.arcSegments; i++)
    perimeter.push(pt(R, half - (2 * half * i) / B.arcSegments, roof));
  const center = [0, roof, -12];
  const roofQuads = [];
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i],
      b = perimeter[(i + 1) % perimeter.length],
      mid = a.map((x, j) => (x + b[j]) / 2);
    if (Math.hypot(a[0] - b[0], a[2] - b[2]) < 1e-8) continue;
    // Two triangles with a midpoint allow the shared quad writer; all top faces wind up.
    const q = [center, b, mid, a];
    const u = q[1].map((x, j) => x - q[0][j]),
      v = q[2].map((x, j) => x - q[0][j]);
    if (u[2] * v[0] - u[0] * v[2] < 0) q.reverse();
    roofQuads.push(q);
  }
  add('roof', 'closed-roof-deck', roofQuads, 'stone');
  arcBand(
    'curved-parapet',
    roof + 0.22,
    B.parapetHeight - 0.22,
    R - 0.18,
    R + 0.16,
  );
  for (const x of [-w, w])
    box(
      'roof',
      'side-parapet-' + x,
      [x - 0.12, roof, B.rearZ],
      [x + 0.12, top, sideZ],
      'stone',
    );
  box(
    'roof',
    'rear-parapet',
    [-w, roof, B.rearZ - 0.12],
    [w, top, B.rearZ + 0.12],
    'stone',
  );
  box(
    'roof',
    'setback-service-enclosure',
    [-3, roof, -18],
    [3, roof + 0.85, -14],
    'metal',
  );
  // Constructed slab fields, curb profiles and bounded road connection.
  function paving(zone, x0, x1, z0, z1, module) {
    const nx = Math.ceil((x1 - x0) / module),
      nz = Math.ceil((z1 - z0) / module),
      dx = (x1 - x0) / nx,
      dz = (z1 - z0) / nz,
      j = S.pavingJoint / 2;
    for (let x = 0; x < nx; x++)
      for (let z = 0; z < nz; z++)
        box(
          zone,
          'slab-' + x + '-' + z,
          [x0 + x * dx + j, -0.14, z0 + z * dz + j],
          [x0 + (x + 1) * dx - j, 0, z0 + (z + 1) * dz - j],
          'paving',
        );
  }
  paving(
    'plaza',
    -S.coreWidth / 2,
    S.coreWidth / 2,
    0.02,
    S.forecourtDepth,
    S.pavingModule,
  );
  paving('plaza', -S.coreWidth / 2, -w - 0.25, B.rearZ, 0.02, S.pavingModule);
  paving('plaza', w + 0.25, S.coreWidth / 2, B.rearZ, 0.02, S.pavingModule);
  const apron = [];
  for (let i = 0; i < B.arcSegments; i++) {
    const a = pt(R, -half + (2 * half * i) / B.arcSegments, 0),
      b = pt(R, -half + (2 * half * (i + 1)) / B.arcSegments, 0);
    apron.push([a, [a[0], 0, 0.02], [b[0], 0, 0.02], b]);
  }
  add('plaza', 'continuous-curved-entrance-apron', apron, 'paving');
  paving('link', -S.linkWidth / 2, S.linkWidth / 2, 12, 24 - S.rampRun, 1.5);
  const rw = S.rampClearWidth / 2;
  add(
    'link',
    'continuous-ramp',
    [
      [
        [-rw, 0, 24 - S.rampRun],
        [-rw, -S.roadDrop, 24],
        [rw, -S.roadDrop, 24],
        [rw, 0, 24 - S.rampRun],
      ],
    ],
    'paving',
  );
  box(
    'road',
    'road-volume',
    [-S.roadLength / 2, -0.3, 24],
    [S.roadLength / 2, -S.roadDrop, 24 + S.roadWidth],
    'asphalt',
  );
  for (const [a, b] of [
    [-14, -rw],
    [rw, 14],
  ])
    box('road', 'curb-' + a, [a, -0.15, 23.85], [b, 0.02, 24], 'stone');
  for (let x = -12; x < 12; x += 4)
    box(
      'road',
      'center-dash-' + x,
      [x, -0.149, 27.93],
      [x + 2, -0.146, 28.07],
      'marking',
    );
  function bench(x, z) {
    for (let i = 0; i < 5; i++)
      box(
        'props',
        'seat-slat-' + x + '-' + i,
        [x - 0.9, 0.43, z - 0.24 + i * 0.105],
        [x + 0.9, 0.49, z - 0.155 + i * 0.105],
        'wood',
      );
    for (let i = 0; i < 3; i++)
      box(
        'props',
        'back-slat-' + x + '-' + i,
        [x - 0.9, 0.59 + i * 0.12, z - 0.3],
        [x + 0.9, 0.68 + i * 0.12, z - 0.245],
        'wood',
      );
    for (const dx of [-0.67, 0.55]) {
      box(
        'props',
        'bench-leg-' + x + '-' + dx,
        [x + dx, 0, z - 0.23],
        [x + dx + 0.12, 0.43, z + 0.23],
        'metal',
      );
      box(
        'props',
        'bench-back-' + x + '-' + dx,
        [x + dx, 0.43, z - 0.32],
        [x + dx + 0.08, 0.98, z - 0.25],
        'metal',
      );
    }
  }
  bench(-8, 5);
  bench(8, 5);
  bench(-8, 9);
  for (const socket of cfg.plantingSockets) {
    const [x, , z] = socket.position,
      half = 1.4,
      wall = 0.13;
    box(
      'props',
      'planter-base-' + x,
      [x - half, -0.14, z - half],
      [x + half, 0.12, z + half],
      'stone',
    );
    for (const sign of [-1, 1]) {
      const xx = x + sign * (half - wall / 2);
      box(
        'props',
        'planter-side-' + x + '-' + sign,
        [xx - wall / 2, 0.12, z - half],
        [xx + wall / 2, 0.65, z + half],
        'stone',
      );
      const zz = z + sign * (half - wall / 2);
      box(
        'props',
        'planter-end-' + x + '-' + sign,
        [x - half, 0.12, zz - wall / 2],
        [x + half, 0.65, zz + wall / 2],
        'stone',
      );
    }
    box(
      'props',
      'soil-NO-tree-placeholder-' + x,
      [x - half + wall, 0.12, z - half + wall],
      [x + half - wall, 0.5, z + half - wall],
      'soil',
    );
  }
  for (const x of [-19, 19]) {
    box(
      'props',
      'light-base-' + x,
      [x - 0.2, 0, 7.8],
      [x + 0.2, 0.16, 8.2],
      'metal',
    );
    box(
      'props',
      'light-pole-' + x,
      [x - 0.055, 0.16, 7.945],
      [x + 0.055, 4.3, 8.055],
      'metal',
    );
    box(
      'props',
      'light-cap-' + x,
      [x - 0.35, 4.3, 7.7],
      [x + 0.35, 4.42, 8.3],
      'metal',
    );
  }
  for (const g of groups.values()) {
    const acc = (n, t, a) =>
      d.createAccessor(n).setType(t).setArray(a).setBuffer(buffer);
    const primitive = d
      .createPrimitive()
      .setAttribute('POSITION', acc('p', 'VEC3', new Float32Array(g.p)))
      .setAttribute('NORMAL', acc('n', 'VEC3', new Float32Array(g.n)))
      .setAttribute('TEXCOORD_0', acc('uv', 'VEC2', new Float32Array(g.uv)))
      .setIndices(acc('i', 'SCALAR', new Uint32Array(g.i)))
      .setMaterial(mats[g.mat]);
    const mesh = d.createMesh(g.zone + ':' + g.mat).addPrimitive(primitive);
    scene.addChild(
      d
        .createNode(g.zone + ':' + g.mat)
        .setMesh(mesh)
        .setExtras({ zone: g.zone, studyOnly: true }),
    );
  }
  const report = {
    sourceComponents: parts.length,
    batches: groups.size,
    materials: Object.keys(mats).length,
    triangles: [...groups.values()].reduce((s, g) => s + g.i.length / 3, 0),
    zones: [...new Set(parts.map((p) => p.zone))],
    dimensions: {
      frontage: width,
      depth: 24,
      roofHeight: roof,
      totalHeight: top,
      coreSite: [42, 36],
      linkLength: 12,
      road: [28, 8],
    },
    curveChordErrorMeters: R * (1 - Math.cos(half / B.arcSegments)),
    route: {
      clearWidth: S.rampClearWidth,
      slope: S.roadDrop / S.rampRun,
      rampEndY: -S.roadDrop,
      roadTopY: -S.roadDrop,
    },
    collisions: {
      status:
        'planning volumes only; no render colliders and no movement/collision implementation',
      footprint: { frontRadius: R, halfAngle: half, rearZ: B.rearZ },
      entryOpeningWidth: 4.6,
    },
    parts,
  };
  for (const z of [
    'front',
    'left',
    'right',
    'rear',
    'roof',
    'entry',
    'plaza',
    'link',
    'road',
    'props',
  ])
    assert(report.zones.includes(z));
  assert.equal(report.route.rampEndY, report.route.roadTopY);
  assert(Math.abs(report.route.slope - 1 / 12) < 1e-12);
  assert(report.curveChordErrorMeters < 0.001);
  assert(Math.abs(top - 24.8) < 1e-9);
  assert([...groups.keys()].every((n) => !n.includes('COLLIDER')));
  return { d, report };
}
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });
const { d, report } = build();
const bytes = await io.writeBinary(d),
  repeat = await io.writeBinary(build().d);
assert.equal(sha(bytes), sha(repeat));
await fs.writeFile(path.join(out, 'landmark-study.glb'), bytes);
const valid = await validator.validateBytes(bytes, {
  uri: 'landmark-study.glb',
  writeTimestamp: false,
});
await fs.writeFile(
  path.join(evidence, 'landmark-validation.json'),
  JSON.stringify(valid, null, 2) + '\n',
);
assert.equal(valid.issues.numErrors, 0);
assert.equal(valid.issues.numWarnings, 0);
await d.transform(
  dedup(),
  weld(),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
const opt = await io.writeBinary(d);
await fs.writeFile(path.join(out, 'landmark-study.meshopt.glb'), opt);
const optValid = await validator.validateBytes(opt, {
  uri: 'landmark-study.meshopt.glb',
  writeTimestamp: false,
});
await fs.writeFile(
  path.join(evidence, 'landmark-meshopt-validation.json'),
  JSON.stringify(optValid, null, 2) + '\n',
);
assert.equal(optValid.issues.numErrors, 0);
assert.equal(optValid.issues.numWarnings, 0);
report.scope = cfg.purpose;
report.sourceConfigSha256 = sha(
  await fs.readFile('scripts/a1/landmark-study.json'),
);
report.output = {
  bytes: bytes.length,
  sha256: sha(bytes),
  repeatSha256: sha(repeat),
  meshoptBytes: opt.length,
  meshoptSha256: sha(opt),
};
report.validation = {
  original: {
    errors: valid.issues.numErrors,
    warnings: valid.issues.numWarnings,
    infos: valid.issues.numInfos,
  },
  meshopt: {
    errors: optValid.issues.numErrors,
    warnings: optValid.issues.numWarnings,
    infos: optValid.issues.numInfos,
  },
};
report.notVerified = [
  'Blender authoring/export',
  'final premium art',
  'UV/PBR texture quality',
  'planting/hero',
  'collision/navigation',
  'transmission/interiors/reflections',
  'GPU performance',
  'owner acceptance',
];
await fs.writeFile(
  path.join(evidence, 'landmark-study.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify({ ...report, parts: 'see evidence file' }, null, 2));
