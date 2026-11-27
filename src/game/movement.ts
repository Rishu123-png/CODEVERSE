import {
  CITY_BLOCKS,
  DISTRICT_BOUNDS,
  STREET_TREES,
  ACCENT_TREES,
  STREET_BENCHES,
} from './districtLayout';
export interface Position2 {
  x: number;
  z: number;
}
export const SPAWN = { x: 0, z: 18 };
const RADIUS = 0.3;
const obstacles = [
  { x: -8, z: 5, w: 2.15, d: 1.05 },
  { x: 8, z: 5, w: 2.15, d: 1.05 },
  { x: -8, z: 9, w: 2.15, d: 1.05 },
  { x: -17.5, z: 3, w: 2.8, d: 2.8 },
  { x: 17.5, z: 3, w: 2.8, d: 2.8 },
  { x: 12, z: 8.5, w: 2.8, d: 2.8 },
  { x: -5, z: 9.3, w: 2.16, d: 2.16 },
  ...[-1, 1].flatMap((side) => [
    { x: side * 11, z: 0.15, w: 5.2, d: 3.7 },
    { x: side * 4.7, z: 2.3, w: 0.18, d: 0.24 },
    ...[-12, -4, 9].map((z) => ({ x: side * 22, z, w: 2.4, d: 4.3 })),
    { x: side * 18, z: 11, w: 0.36, d: 0.36 },
  ]),
];
export function isBlocked(x: number, z: number): boolean {
  const B = DISTRICT_BOUNDS;
  if (
    x < B.minX + 0.3 ||
    x > B.maxX - 0.3 ||
    z < B.minZ + 0.3 ||
    z > B.maxZ - 0.3
  )
    return true;
  if (Math.abs(x) > 55.8 && Math.abs(z - 28) < 4.5) return true;
  if ((z < -58.7 || z > 72.7) && Math.abs(Math.abs(x) - 29) < 4.1) return true;
  if (
    CITY_BLOCKS.some(
      (b) =>
        Math.abs(x - b.x) < b.w / 2 + 0.65 &&
        Math.abs(z - b.z) < b.d / 2 + 1.55,
    )
  )
    return true;
  if (
    [...STREET_TREES, ...ACCENT_TREES].some(
      ([X, Z]) => Math.hypot(x - X, z - Z) < 0.43,
    )
  )
    return true;
  if (
    STREET_BENCHES.some(
      ([X, Z]) => Math.abs(x - X) < 1.35 && Math.abs(z - Z) < 0.83,
    )
  )
    return true;
  if (Math.abs(x - 44) < 3.5 && Math.abs(z - 9) < 3.2) return true;
  const bx = Math.min(Math.abs(x), 15.8);
  const front = Math.sqrt(22 * 22 - bx * bx) - 22;
  if (Math.abs(x) < 15.8 + RADIUS && z < front + RADIUS && z > -24.3 - RADIUS)
    return true;
  if (z > 13.6 && z < 22.45 && Math.abs(Math.abs(x) - 8) < 3.85) return true;

  return obstacles.some(
    (o) =>
      Math.abs(x - o.x) < o.w / 2 + RADIUS &&
      Math.abs(z - o.z) < o.d / 2 + RADIUS,
  );
}
export function moveWithCollision(
  p: Position2,
  dx: number,
  dz: number,
): Position2 {
  // Axis-separated small steps avoid tunneling and permit wall sliding.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  let { x, z } = p;
  for (let i = 0; i < steps; i++) {
    if (!isBlocked(x + dx / steps, z)) x += dx / steps;
    if (!isBlocked(x, z + dz / steps)) z += dz / steps;
  }
  return { x, z };
}
export function groundHeight(z: number, x = 0): number {
  // Kinematic feet follow the same road/pavement sections as the authored mesh.
  const roadDistance = Math.min(
    Math.abs(z - 28) - 4,
    Math.abs(z + 36) - 3.5,
    Math.abs(z - 68) - 3.5,
    Math.abs(Math.abs(x) - 29) - 3.5,
  );
  if (Math.abs(x) < 0.9 && z > 22.2 && z <= 24)
    return (-(z - 22.2) / 1.8) * 0.15;
  if (roadDistance < 0) return -0.15;
  if (roadDistance < 0.35) return -0.15 * (1 - roadDistance / 0.35);
  if (Math.abs(Math.abs(x) - 44) < 8.8 && z > 4.2 && z < 21.8) return 0.23;
  return 0;
}
export function nearEntrance(p: Position2): boolean {
  return Math.hypot(p.x, p.z - 1.8) < 2.8;
}
