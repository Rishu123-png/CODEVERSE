/* global console, Buffer */
// Offline GGX/RGBD environment bake: no GPU prefilter work during game initialization.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { GetCubeMapTextureData } from '@babylonjs/core/Misc/HighDynamicRange/hdr.js';
import { CubeMapToSphericalPolynomialTools } from '@babylonjs/core/Misc/HighDynamicRange/cubemapToSphericalPolynomial.js';
const sharp = (
  await import(
    pathToFileURL(
      path.resolve('.cache/a1/tools/node_modules/sharp/dist/index.mjs'),
    ).href
  )
).default;
const bytes = await fs.readFile('.cache/g2/pedestrian_overpass_1k.hdr');
const size = 256;
const cube = GetCubeMapTextureData(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  size,
  true,
);
const names = ['right', 'left', 'up', 'down', 'front', 'back'];
const polynomial =
  CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(
    cube,
    64,
  );
const irradiance = Object.fromEntries(
  ['x', 'y', 'z', 'xx', 'yy', 'zz', 'xy', 'yz', 'zx'].map((k) => [
    k,
    polynomial[k].asArray(),
  ]),
);
const direction = (face, u, v) =>
  [
    [1, -v, -u],
    [-1, -v, u],
    [u, 1, v],
    [u, -1, -v],
    [u, -v, 1],
    [-u, -v, -1],
  ][face];
function sample(x, y, z, c) {
  const ax = Math.abs(x),
    ay = Math.abs(y),
    az = Math.abs(z);
  let f, u, v, major;
  if (ax >= ay && ax >= az) {
    major = ax;
    f = x > 0 ? 0 : 1;
    u = x > 0 ? -z : z;
    v = -y;
  } else if (ay >= az) {
    major = ay;
    f = y > 0 ? 2 : 3;
    u = x;
    v = y > 0 ? z : -z;
  } else {
    major = az;
    f = z > 0 ? 4 : 5;
    u = z > 0 ? x : -x;
    v = -y;
  }
  const px = Math.min(
    size - 1,
    Math.max(0, Math.round((u / major + 1) * size * 0.5 - 0.5)),
  );
  const py = Math.min(
    size - 1,
    Math.max(0, Math.round((v / major + 1) * size * 0.5 - 0.5)),
  );
  return Math.min(255, cube[names[f]][(py * size + px) * 3 + c]);
}
const images = [],
  mipmaps = [];
let position = 0;
for (let mip = 0; mip <= 8; mip++) {
  const n = size >> mip,
    rough = mip / 8,
    alpha = rough * rough,
    light = [];
  for (let i = 0; i < 128; i++) {
    let bits = i,
      radical = 0,
      denom = 0.5;
    while (bits) {
      radical += (bits & 1) * denom;
      bits >>>= 1;
      denom *= 0.5;
    }
    const phi = (i / 128) * Math.PI * 2,
      cos = Math.sqrt((1 - radical) / (1 + (alpha * alpha - 1) * radical)),
      sin = Math.sqrt(1 - cos * cos),
      z = 2 * cos * cos - 1;
    if (z > 0)
      light.push([
        2 * cos * sin * Math.cos(phi),
        2 * cos * sin * Math.sin(phi),
        z,
      ]);
  }
  for (let face = 0; face < 6; face++) {
    const rgba = new Uint8Array(n * n * 4);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        let N = direction(
          face,
          (2 * (x + 0.5)) / n - 1,
          (2 * (y + 0.5)) / n - 1,
        );
        const len = Math.hypot(...N);
        N = N.map((v) => v / len);
        let T = Math.abs(N[1]) < 0.99 ? [N[2], 0, -N[0]] : [0, -N[2], N[1]];
        const tl = Math.hypot(...T);
        T = T.map((v) => v / tl);
        const B = [
            N[1] * T[2] - N[2] * T[1],
            N[2] * T[0] - N[0] * T[2],
            N[0] * T[1] - N[1] * T[0],
          ],
          rgb = [0, 0, 0];
        let weight = 0;
        if (mip === 0) {
          for (let c = 0; c < 3; c++)
            rgb[c] = Math.min(255, cube[names[face]][(y * n + x) * 3 + c]);
        } else {
          for (const L of light) {
            const D = N.map((v, k) => T[k] * L[0] + B[k] * L[1] + v * L[2]);
            for (let c = 0; c < 3; c++) rgb[c] += sample(...D, c) * L[2];
            weight += L[2];
          }
          for (let c = 0; c < 3; c++) rgb[c] /= weight;
        }
        const d = Math.min(
            1,
            Math.floor(Math.max(255 / Math.max(...rgb, 0.00001), 1)) / 255,
          ),
          o = (y * n + x) * 4;
        for (let c = 0; c < 3; c++)
          rgba[o + c] = Math.round(
            Math.min(1, Math.pow(rgb[c] * d, 1 / 2.2)) * 255,
          );
        rgba[o + 3] = Math.round(d * 255);
      }
    const image = await sharp(rgba, {
      raw: { width: n, height: n, channels: 4 },
    })
      .png()
      .toBuffer();
    mipmaps.push({ length: image.length, position });
    images.push(image);
    position += image.length;
  }
  console.log('GGX environment mip', mip, n);
}
const header = {
  version: 2,
  width: size,
  imageType: 'image/png',
  irradiance,
  specular: { mipmaps, lodGenerationScale: 0.8 },
};
await fs.writeFile(
  'public/assets/g1/daylight-urban.env',
  Buffer.concat([
    Buffer.from([0x86, 0x16, 0x87, 0x96, 0xf6, 0xd6, 0x96, 0x36]),
    Buffer.from(JSON.stringify(header) + '\0'),
    ...images,
  ]),
);
console.log('Offline HDR environment baked:', position, 'image bytes');
