/* global console */
// Original deterministic multiscale material maps; no third-party photo inputs.
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
const N = 512;
const hash = (x, y) => {
  let v = Math.imul(x + 31, 374761393) ^ Math.imul(y + 811, 668265263);
  v = Math.imul(v ^ (v >>> 13), 1274126177);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967295;
};
function noise(x, y, scale) {
  x = x / scale;
  y = y / scale;
  const X = Math.floor(x),
    Y = Math.floor(y),
    u = x - X,
    v = y - Y,
    s = u * u * (3 - 2 * u),
    t = v * v * (3 - 2 * v);
  const a = hash(X, Y),
    b = hash(X + 1, Y),
    c = hash(X, Y + 1),
    d = hash(X + 1, Y + 1);
  return a * (1 - s) * (1 - t) + b * s * (1 - t) + c * (1 - s) * t + d * s * t;
}
for (const [name, base, kind] of [
  ['stone', [155, 153, 145], 'stone'],
  ['basalt', [72, 80, 86], 'stone'],
  ['asphalt', [54, 59, 65], 'asphalt'],
  ['timber', [112, 68, 35], 'wood'],
  ['bark', [100, 77, 51], 'wood'],
  ['fabric', [155, 163, 178], 'fabric'],
  ['grass', [84, 104, 53], 'grass'],
]) {
  const heights = new Float32Array(N * N),
    rgb = new Uint8Array(N * N * 3),
    normal = new Uint8Array(N * N * 3),
    mr = new Uint8Array(N * N * 3);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let h =
        noise(x, y, 64) * 0.5 +
        noise(x, y, 16) * 0.25 +
        noise(x, y, 4) * 0.15 +
        hash(x, y) * 0.1;
      if (kind === 'wood')
        h =
          0.45 +
          0.22 * Math.sin(x * 0.4 + noise(x, y, 80) * 8) +
          0.15 * Math.sin(x * 0.9 + noise(x, y, 40) * 5) +
          hash(x, y) * 0.13;
      if (kind === 'fabric')
        h =
          0.5 +
          0.2 * Math.sin(x * Math.PI) * Math.sin(y * Math.PI) +
          0.07 * Math.sin(x * 2.09 + y * 2.09) +
          hash(x, y) * 0.1;
      heights[y * N + x] = h;
      const i = (y * N + x) * 3,
        grain =
          (h - 0.5) *
          (kind === 'asphalt'
            ? 16
            : kind === 'wood'
              ? 58
              : kind === 'grass'
                ? 55
                : 34);
      for (let c = 0; c < 3; c++)
        rgb[i + c] = Math.max(0, Math.min(255, base[c] + grain));
      mr[i] = 255;
      mr[i + 1] =
        kind === 'wood'
          ? 170 + h * 45
          : kind === 'asphalt'
            ? 212 + h * 30
            : 175 + h * 52;
      mr[i + 2] = 0;
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 3,
        dx =
          (heights[y * N + ((x + 1) % N)] -
            heights[y * N + ((x + N - 1) % N)]) *
          0.45,
        dy =
          (heights[((y + 1) % N) * N + x] -
            heights[((y + N - 1) % N) * N + x]) *
          0.45,
        len = Math.hypot(dx, dy, 1);
      normal[i] = 128 - (dx / len) * 127;
      normal[i + 1] = 128 - (dy / len) * 127;
      normal[i + 2] = 128 + 127 / len;
    }
  const image = (a) => sharp(a, { raw: { width: N, height: N, channels: 3 } });
  await fs.writeFile(
    `public/assets/g1/v2-${name}-color.jpg`,
    await image(rgb).jpeg({ quality: 88 }).toBuffer(),
  );
  await fs.writeFile(
    `public/assets/g1/v2-${name}-normal.png`,
    await image(normal).png().toBuffer(),
  );
  await fs.writeFile(
    `public/assets/g1/v2-${name}-roughness.jpg`,
    await image(mr).jpeg({ quality: 90 }).toBuffer(),
  );
}
console.log('Seven original multiscale material families generated.');
function noise3(x, y, z) {
  const X = Math.floor(x),
    Y = Math.floor(y),
    Z = Math.floor(z),
    fade = (t) => t * t * (3 - 2 * t),
    u = fade(x - X),
    v = fade(y - Y),
    w = fade(z - Z);
  let value = 0;
  for (let a = 0; a < 2; a++)
    for (let b = 0; b < 2; b++)
      for (let c = 0; c < 2; c++)
        value +=
          hash(X + a + (Y + b) * 67, Z + c + (Y + b) * 113) *
          (a ? u : 1 - u) *
          (b ? v : 1 - v) *
          (c ? w : 1 - w);
  return value;
}
// Directionally consistent original cloud sky cubemap (sRGB bytes, no HDRI download).
const S = 128;
for (let face = 0; face < 6; face++) {
  const pixels = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const u = (2 * (x + 0.5)) / S - 1,
        v = (2 * (y + 0.5)) / S - 1;
      let D = [
        [1, -v, -u],
        [-1, -v, u],
        [u, 1, v],
        [u, -1, -v],
        [u, -v, 1],
        [-u, -v, -1],
      ][face];
      const len = Math.hypot(...D);
      D = D.map((a) => a / len);
      const t = Math.max(0, Math.min(1, (D[1] + 0.02) / 0.75)),
        cloudRaw =
          noise3(D[0] * 4 + 11, D[1] * 8 + 2, D[2] * 4 + 17) * 0.6 +
          noise3(D[0] * 8 + 21, D[1] * 16 + 1, D[2] * 8 + 27) * 0.28 +
          noise3(D[0] * 16 + 2, D[1] * 32 + 8, D[2] * 16 + 4) * 0.12;
      const cloud =
        Math.max(0, Math.min(0.8, (cloudRaw - 0.5) * 3)) *
        Math.max(0, Math.min(1, (D[1] - 0.05) * 4));
      const haze =
        Math.pow(Math.max(0, D[0] * 0.58 + D[1] * 0.67 + D[2] * 0.46), 28) *
        0.4;
      const base = [
        144 * (1 - t) + 45 * t,
        186 * (1 - t) + 110 * t,
        226 * (1 - t) + 197 * t,
      ];
      const i = (y * S + x) * 4;
      for (let c = 0; c < 3; c++)
        pixels[i + c] =
          base[c] * (1 - cloud) +
          (235 - c * 3) * cloud +
          haze * [50, 36, 12][c];
      pixels[i + 3] = 255;
    }
  await fs.writeFile(`public/assets/g1/v2-sky-${face}.rgba`, pixels);
}
