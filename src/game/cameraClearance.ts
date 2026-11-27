export interface CanopyVolume {
  center: { x: number; y: number; z: number };
  radius: { x: number; y: number; z: number };
}

/** Distance along a finite world-space camera arm to an inflated crown ellipsoid.
 * This tests volumes, not alpha-cutout triangles, and never fades every shared tree.
 */
export function canopyClearance(
  origin: CanopyVolume['center'],
  end: CanopyVolume['center'],
  crowns: CanopyVolume[],
  padding = 0.28,
): number {
  const d = { x: end.x - origin.x, y: end.y - origin.y, z: end.z - origin.z };
  const length = Math.hypot(d.x, d.y, d.z);
  if (length < 0.001) return length;
  let clear = length;
  for (const crown of crowns) {
    let a = 0,
      b = 0,
      c = -1;
    for (const axis of ['x', 'y', 'z'] as const) {
      const r = Math.max(0.01, crown.radius[axis]) + padding;
      const o = (origin[axis] - crown.center[axis]) / r;
      const v = d[axis] / length / r;
      a += v * v;
      b += 2 * o * v;
      c += o * o;
    }
    // A target already inside foliage cannot be cleared by shortening its arm.
    // High crowns / deliberately clear footpaths prevent that normal-play case.
    if (c < 0) continue;
    const disc = b * b - 4 * a * c;
    if (disc < 0) continue;
    const hit = (-b - Math.sqrt(disc)) / (2 * a);
    if (hit >= 0 && hit < clear) clear = Math.max(0, hit - padding);
  }
  return clear;
}
