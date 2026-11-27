/* global console */
// New A1 asset/source checks only. No Blender startup, game integration or retarget claim.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const cache = path.resolve('.cache/a1-final');
const ezCommit = 'dcf309bd86bd521083d9c70f01f2de45fdc7c457';
const animCommit = 'e24c23cf2a1323488a3faa226ea7ea21f644b73e';
const ez = path.join(cache, 'sources/ez-tree-' + ezCommit);
const anim = path.join(
  cache,
  'sources/gltf-universal-animation-library-' + animCommit,
);
const npm = path.join(cache, 'sources/ez-tree-npm/package');
const evidence = 'docs/evidence/a1-final';
await fs.mkdir(evidence, { recursive: true });
await fs.mkdir(path.join(cache, 'generated'), { recursive: true });
const load = (p) =>
  import(pathToFileURL(path.resolve('.cache/a1/tools/node_modules', p)).href);
const { build } = await load('esbuild/lib/main.js');
await build({
  entryPoints: [path.join(ez, 'src/lib/tree.js')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: path.join(cache, 'tree-node.mjs'),
  nodePaths: [path.join(cache, 'tools/node_modules')],
  logLevel: 'warning',
});
const { Tree } = await import(
  pathToFileURL(path.join(cache, 'tree-node.mjs')).href
);
const { Document, NodeIO } = await load('@gltf-transform/core/dist/index.js');
const sharp = (await load('sharp/dist/index.mjs')).default;
const validator = await load('gltf-validator/index.js');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const fileInfo = async (p) => {
  const b = await fs.readFile(p);
  return { bytes: b.length, sha256: sha(b) };
};
const veg = {
  scope:
    'Acquired source/texture and static GLB/LOD vegetation path, NOT accepted premium vegetation',
  source: {
    repository: 'https://github.com/dgreenheck/ez-tree',
    commit: ezCommit,
    archive: await fileInfo(path.join(cache, 'ez-tree.zip')),
    npmVersion: '1.1.0',
    npmArchive: await fileInfo(
      path.join(cache, 'dgreenheck-ez-tree-1.1.0.tgz'),
    ),
    three: '0.167.1',
  },
  rights: {
    codeAndLeafTextures: 'MIT; retain Daniel Greenheck notice',
    bark: 'Latest source notice identifies ambientCG CC0; bark not used in these generated GLBs',
    decision:
      'Viable no-account offline source path; conditional art/LOD acceptance, not a CC0 label for entire pack',
  },
  textures: [],
  variants: [],
};
for (const name of ['ash', 'aspen', 'oak', 'pine']) {
  const p = path.join(npm, 'src/lib/assets/leaves/' + name + '_color.png'),
    bytes = await fs.readFile(p);
  const pointer = await fs.readFile(
    path.join(ez, 'src/app/public/textures/leaves/' + name + '.png'),
    'utf8',
  );
  const oid = pointer.match(/oid sha256:([a-f0-9]+)/)[1];
  assert.equal(sha(bytes), oid);
  const metadata = await sharp(bytes).metadata();
  const { data } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let transparent = 0,
    opaque = 0,
    partial = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 0) transparent++;
    else if (data[i] === 255) opaque++;
    else partial++;
  }
  veg.textures.push({
    name,
    ...(await fileInfo(p)),
    githubLfsOid: oid,
    exactOidMatch: true,
    width: metadata.width,
    height: metadata.height,
    hasAlpha: metadata.hasAlpha,
    alphaPixels: { transparent, opaque, partial },
  });
}
await fs.copyFile(
  path.join(ez, 'LICENSE'),
  path.join(evidence, 'ez-tree-MIT.txt'),
);
await fs.copyFile(
  path.join(ez, 'src/app/public/textures/LICENSE.md'),
  path.join(evidence, 'ez-tree-texture-notice.txt'),
);
await fs.copyFile(
  path.join(anim, 'LICENSE'),
  path.join(evidence, 'animation-mirror-CC0.txt'),
);
await fs.copyFile(
  path.join(anim, 'README.md'),
  path.join(evidence, 'animation-mirror-readme.txt'),
);
const io = new NodeIO();
const details = [
  {},
  { sectionStride: 2, segmentFactor: 0.65, leafStride: 2 },
  { sectionStride: 3, segmentFactor: 0.45, leafStride: 4 },
];
for (const [preset, height] of [
  ['ash_medium', 8],
  ['bush_1', 1.2],
]) {
  const config = JSON.parse(
    await fs.readFile(
      path.join(ez, 'src/lib/presets/' + preset + '.json'),
      'utf8',
    ),
  );
  config.bark.textured = false;
  const tree = new Tree();
  tree.loadFromJson(config);
  const full = tree.createGeometry();
  let minY = Infinity,
    maxY = -Infinity;
  for (const g of Object.values(full)) {
    const a = g.getAttribute('position').array;
    for (let i = 1; i < a.length; i += 3) {
      minY = Math.min(minY, a[i]);
      maxY = Math.max(maxY, a[i]);
    }
  }
  const scale = height / (maxY - minY);
  for (let level = 0; level < details.length; level++) {
    const geometries = tree.createGeometry(details[level]),
      d = new Document(),
      buffer = d.createBuffer(),
      scene = d.createScene(preset + '-LOD' + level);
    d.getRoot().setDefaultScene(scene);
    d.getRoot().getAsset().copyright =
      'EZ-Tree / leaf texture © 2024 Daniel Greenheck, MIT; CodeVerse A1 static export study';
    const tex = d
      .createTexture('ash MIT exact-byte source')
      .setImage(
        new Uint8Array(
          await fs.readFile(
            path.join(npm, 'src/lib/assets/leaves/ash_color.png'),
          ),
        ),
      )
      .setMimeType('image/png');
    const leaf = d
      .createMaterial('MIT leaf cutout; static no wind')
      .setBaseColorTexture(tex)
      .setAlphaMode('MASK')
      .setAlphaCutoff(0.5)
      .setDoubleSided(true)
      .setRoughnessFactor(0.9)
      .setMetallicFactor(0);
    const bark = d
      .createMaterial('original scalar trunk STUDY')
      .setBaseColorFactor([0.18, 0.12, 0.07, 1])
      .setRoughnessFactor(0.95)
      .setMetallicFactor(0);
    const metrics = {};
    for (const [name, g] of Object.entries(geometries)) {
      const primitive = d.createPrimitive(),
        acc = (name, type, array) =>
          d
            .createAccessor(name)
            .setType(type)
            .setArray(array)
            .setBuffer(buffer);
      for (const [a, semantic, type] of [
        ['position', 'POSITION', 'VEC3'],
        ['normal', 'NORMAL', 'VEC3'],
        ['uv', 'TEXCOORD_0', 'VEC2'],
      ]) {
        const arr = new Float32Array(g.getAttribute(a).array);
        if (a === 'position')
          for (let i = 0; i < arr.length; i += 3) {
            arr[i] *= scale;
            arr[i + 1] = (arr[i + 1] - minY) * scale;
            arr[i + 2] *= scale;
          }
        assert(arr.every(Number.isFinite));
        primitive.setAttribute(semantic, acc(name + a, type, arr));
      }
      const indices = new Uint32Array(g.index.array);
      primitive
        .setIndices(acc(name + 'indices', 'SCALAR', indices))
        .setMaterial(name === 'leaves' ? leaf : bark);
      scene.addChild(
        d.createNode(name).setMesh(d.createMesh(name).addPrimitive(primitive)),
      );
      metrics[name] = {
        vertices: g.getAttribute('position').count,
        triangles: indices.length / 3,
      };
      g.dispose();
    }
    const bytes = await io.writeBinary(d),
      file = preset + '-lod' + level + '.glb';
    await fs.writeFile(path.join(cache, 'generated', file), bytes);
    const v = await validator.validateBytes(bytes, {
      uri: file,
      writeTimestamp: false,
    });
    assert.equal(v.issues.numErrors, 0);
    assert.equal(v.issues.numWarnings, 0);
    veg.variants.push({
      preset,
      level,
      detail: details[level],
      targetFullHeightMeters: height,
      sourcePresetSha256: sha(
        await fs.readFile(path.join(ez, 'src/lib/presets/' + preset + '.json')),
      ),
      uniformScale: scale,
      file,
      bytes: bytes.length,
      sha256: sha(bytes),
      geometry: metrics,
      triangles: Object.values(metrics).reduce((s, m) => s + m.triangles, 0),
      validation: {
        errors: v.issues.numErrors,
        warnings: v.issues.numWarnings,
        infos: v.issues.numInfos,
      },
    });
  }
  for (const g of Object.values(full)) g.dispose();
  tree.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
}
veg.notVerified = [
  'Botanical/urban art acceptance',
  'flowering accent',
  'final bark/PBR',
  'wind transfer: Three onBeforeCompile is NOT glTF animation',
  'cross-LOD visual continuity',
  'Babylon alpha sorting/overdraw/performance',
  'physical GPU workload',
  'final species/height approval',
];
await fs.writeFile(
  path.join(evidence, 'vegetation-inspection.json'),
  JSON.stringify(veg, null, 2) + '\n',
);
// Inspect the exact archived animation glTF, not the current paid tiers or 2026 release.
const gltf = path.join(anim, 'glTF/AnimationLibrary_Godot_Standard.gltf'),
  j = JSON.parse(await fs.readFile(gltf, 'utf8'));
const d = await io.read(gltf),
  clips = [];
for (const a of d.getRoot().listAnimations()) {
  let lo = Infinity,
    hi = -Infinity,
    maxRotationSeamDegrees = 0,
    maxTranslationSeam = 0;
  const paths = {},
    targets = new Set();
  for (const c of a.listChannels()) {
    paths[c.getTargetPath()] = (paths[c.getTargetPath()] || 0) + 1;
    targets.add(c.getTargetNode().getName());
    const s = c.getSampler(),
      t = s.getInput().getArray(),
      v = s.getOutput().getArray();
    lo = Math.min(lo, t[0]);
    hi = Math.max(hi, t[t.length - 1]);
    if (c.getTargetPath() === 'rotation') {
      const q1 = Array.from(v.slice(0, 4)),
        q2 = Array.from(v.slice(-4));
      const dot =
        q1.reduce((s, x, i) => s + x * q2[i], 0) /
        (Math.hypot(...q1) * Math.hypot(...q2));
      maxRotationSeamDegrees = Math.max(
        maxRotationSeamDegrees,
        (2 * Math.acos(Math.min(1, Math.abs(dot))) * 180) / Math.PI,
      );
    } else if (c.getTargetPath() === 'translation')
      maxTranslationSeam = Math.max(
        maxTranslationSeam,
        Math.hypot(
          ...Array.from(v.slice(0, 3), (x, i) => x - v[v.length - 3 + i]),
        ),
      );
  }
  clips.push({
    name: a.getName(),
    startSeconds: lo,
    endSeconds: hi,
    durationSeconds: hi - lo,
    channels: a.listChannels().length,
    paths,
    targetCount: targets.size,
    maxLocalRotationEndpointDifferenceDegrees: maxRotationSeamDegrees,
    maxLocalTranslationEndpointDifferenceSourceUnits: maxTranslationSeam,
  });
}
const required = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop'];
assert(required.every((n) => clips.some((c) => c.name === n)));
const sourceBones = j.skins[0].joints.map((i) => j.nodes[i].name),
  mpfb = JSON.parse(
    await fs.readFile(
      '.cache/a1/sources/mpfb2-2.0.18/src/mpfb/data/rigs/standard/rig.game_engine.json',
      'utf8',
    ),
  );
const validation = await validator.validateString(
  await fs.readFile(gltf, 'utf8'),
  {
    uri: path.basename(gltf),
    writeTimestamp: false,
    externalResourceFunction: async (uri) =>
      new Uint8Array(await fs.readFile(path.join(path.dirname(gltf), uri))),
  },
);
await fs.writeFile(
  path.join(evidence, 'animation-source-validation.json'),
  JSON.stringify(validation, null, 2) + '\n',
);
const motion = {
  scope:
    'Exact archived animation data inspection; NOT MPFB retarget/deformation/native runtime acceptance',
  source: {
    repository: 'https://github.com/J-Ponzo/gltf-universal-animation-library',
    commit: animCommit,
    mirrorClaimsOriginalDownloadDate: '2025-06-10',
    archive: await fileInfo(path.join(cache, 'animation-mirror.zip')),
    gltf: await fileInfo(gltf),
    bin: await fileInfo(path.join(path.dirname(gltf), j.buffers[0].uri)),
    readme: await fileInfo(path.join(anim, 'README.md')),
    license: await fileInfo(path.join(anim, 'LICENSE')),
    asset: j.asset,
  },
  rights: {
    mirrorFile:
      'CC0 1.0 text present; README names Quaternius and states Standard/free archive provenance',
    limitations:
      'Third-party mirror, no publisher signature/hash match. README license hyperlink incorrectly points to a different repository. Current publisher page CC0 vs QAL conflict. Hold game adoption; no legal conclusion from mirror alone.',
  },
  animationCount: clips.length,
  requiredClips: required,
  clips,
  rig: {
    sourceJointCount: sourceBones.length,
    sourceJointNames: sourceBones,
    mpfbSourceBoneCount: Object.keys(mpfb).length,
    exactNameIntersection: sourceBones.filter((n) => Object.hasOwn(mpfb, n)),
    decision:
      'Equal joint counts are not skeleton compatibility. Explicit rest-space mapping and actual retarget/deformation test required; name-only track reassignment insufficient.',
  },
  validation: {
    errors: validation.issues.numErrors,
    warnings: validation.issues.numWarnings,
    infos: validation.issues.numInfos,
  },
  notVerified: [
    'Original publisher archive identity',
    'Current 2026 tier/root-motion coverage',
    'MPFB rest-axis mapping',
    'target foot contact and garment clipping',
    'in-place displacement policy',
    'runtime blending/start-stop/turn',
    'finished hero motion quality',
  ],
};
assert.equal(validation.issues.numErrors, 0);
await fs.writeFile(
  path.join(evidence, 'animation-inspection.json'),
  JSON.stringify(motion, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      vegetation: veg.variants.map(({ file, triangles, bytes }) => ({
        file,
        triangles,
        bytes,
      })),
      animationCount: motion.animationCount,
      required: clips.filter((c) => required.includes(c.name)),
      rig: motion.rig,
      validation: motion.validation,
    },
    null,
    2,
  ),
);
