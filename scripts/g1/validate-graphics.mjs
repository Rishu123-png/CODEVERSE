/* global console */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const validator = await import(
  pathToFileURL(
    path.resolve('.cache/a1/tools/node_modules/gltf-validator/index.js'),
  ).href
);
const names = [
  'landmark-v2.glb',
  'site-v3.glb',
  'hero-urban.glb',
  'canopy-v3.glb',
  'oak-v3.glb',
  'blossom-v3.glb',
  'underplanting-v3.glb',
];
const summary = [];
for (const name of names) {
  const bytes = await fs.readFile('public/assets/g1/' + name);
  const result = await validator.validateBytes(bytes, {
    uri: name,
    writeTimestamp: false,
  });
  summary.push({
    file: name,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    errors: result.issues.numErrors,
    warnings: result.issues.numWarnings,
    infos: result.issues.numInfos,
  });
  if (name === 'site-v3.glb')
    await fs.writeFile(
      'docs/evidence/g1-graphics/environment-validation.json',
      JSON.stringify(result, null, 2) + '\n',
    );
  if (name === 'hero-urban.glb')
    await fs.writeFile(
      'docs/evidence/g1-graphics/hero-validation.json',
      JSON.stringify(result, null, 2) + '\n',
    );
  assert.equal(result.issues.numErrors, 0, name + ' has validator errors');
  assert.equal(result.issues.numWarnings, 0, name + ' has validator warnings');
}
await fs.writeFile(
  'docs/evidence/g1-graphics/validation-summary.json',
  JSON.stringify(summary, null, 2) + '\n',
);
console.log(summary);
