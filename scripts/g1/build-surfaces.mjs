/* global console */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const sharp = (
  await import(
    pathToFileURL(
      path.resolve('.cache/a1/tools/node_modules/sharp/dist/index.mjs'),
    ).href
  )
).default;
let seed = 221;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const n = 512,
  color = new Uint8Array(n * n * 3),
  normal = new Uint8Array(n * n * 3);
for (let y = 0; y < n; y++)
  for (let x = 0; x < n; x++) {
    const i = (y * n + x) * 3,
      noise = (rand() - 0.5) * 7,
      cloud = Math.sin(x / 61) * Math.cos(y / 73) * 2,
      edge = Math.min(x, y, n - 1 - x, n - 1 - y) < 2 ? -16 : 0;
    for (let c = 0; c < 3; c++)
      color[i + c] = 178 + noise + cloud + edge + (c === 2 ? 2 : 0);
    normal[i] = 128 + (rand() - 0.5) * 5;
    normal[i + 1] = 128 + (rand() - 0.5) * 5;
    normal[i + 2] = 255;
  }
await fs.writeFile(
  'public/assets/g1/paving-color.jpg',
  await sharp(color, { raw: { width: n, height: n, channels: 3 } })
    .jpeg({ quality: 90 })
    .toBuffer(),
);
await fs.writeFile(
  'public/assets/g1/paving-normal.png',
  await sharp(normal, { raw: { width: n, height: n, channels: 3 } })
    .png()
    .toBuffer(),
);
console.log(
  'Original seamless restrained paving microtexture/normal generated. No downloaded texture.',
);
