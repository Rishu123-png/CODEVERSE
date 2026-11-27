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
  if (x < -23 || x > 23 || z < -27 || z > 32) return true;
  if (z >= 24.15 && Math.abs(x) > 13.7) return true;
  const bx = Math.min(Math.abs(x), 15.8);
  const front = Math.sqrt(22 * 22 - bx * bx) - 22;
  if (Math.abs(x) < 15.8 + RADIUS && z < front + RADIUS && z > -24.3 - RADIUS)
    return true;
  if (z > 12 && z < 23.85 && Math.abs(x) > 2.1 - RADIUS) return true;
  if (z >= 23.6 && z < 24.15 && Math.abs(x) > 0.9 - RADIUS) return true;
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
export function groundHeight(z: number): number {
  return z <= 22.2 ? 0 : z >= 24 ? -0.15 : (-(z - 22.2) / 1.8) * 0.15;
}
export function nearEntrance(p: Position2): boolean {
  return Math.hypot(p.x, p.z - 1.8) < 2.8;
}
