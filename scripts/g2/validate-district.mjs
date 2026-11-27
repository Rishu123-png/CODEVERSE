/* global console */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const validator = await import(
  pathToFileURL(
    path.resolve('.cache/a1/tools/node_modules/gltf-validator/index.js'),
  ).href
);
const old = JSON.parse(
  await fs.readFile('docs/evidence/g1-graphics/runtime-assets.json', 'utf8'),
);
const assets = [];
for (const entry of old.assets) {
  const bytes = await fs.readFile(entry.file);
  const item = {
    file: entry.file,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
  if (entry.file.endsWith('.glb')) {
    const n = bytes.readUInt32LE(12),
      g = JSON.parse(bytes.subarray(20, 20 + n));
    Object.assign(item, {
      meshes: g.meshes?.length,
      materials: g.materials?.length,
      animationClips: (g.animations || []).map((a) => a.name),
    });
    const r = await validator.validateBytes(bytes, {
      uri: entry.file,
      writeTimestamp: false,
    });
    Object.assign(item, {
      errors: r.issues.numErrors,
      warnings: r.issues.numWarnings,
    });
    if (entry.file.endsWith('/site-v3.glb'))
      await fs.writeFile(
        'docs/evidence/g2/environment-validation.json',
        JSON.stringify(r, null, 2) + '\n',
      );
    assert.equal(item.errors, 0, entry.file);
    assert.equal(item.warnings, 0, entry.file);
  }
  assets.push(item);
}
const report = {
  runtimeBytes: assets.reduce((s, a) => s + a.bytes, 0),
  assets,
};
await fs.writeFile(
  'docs/evidence/g2/runtime-assets.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(report);
