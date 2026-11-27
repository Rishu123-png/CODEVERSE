import { describe, it, expect } from 'vitest';
import {
  SPAWN,
  moveWithCollision,
  isBlocked,
  groundHeight,
  nearEntrance,
} from './movement';
describe('real plaza controller geometry', () => {
  it('spawns on clear plaza and gates the actual entrance interaction by distance', () => {
    expect(isBlocked(SPAWN.x, SPAWN.z)).toBe(false);
    expect(nearEntrance(SPAWN)).toBe(false);
    expect(nearEntrance({ x: 0, z: 2 })).toBe(true);
    expect(nearEntrance({ x: 8, z: 2 })).toBe(false);
  });
  it('cannot tunnel through the curved building, including with a large step', () => {
    const p = moveWithCollision(SPAWN, 0, -30);
    expect(p.z).toBeGreaterThanOrEqual(0.3);
    expect(p.z).toBeLessThan(0.5);
    expect(isBlocked(p.x, p.z)).toBe(false);
  });
  it('slides alongside a wall rather than freezing both movement axes', () => {
    const p = moveWithCollision({ x: 0, z: 0.4 }, 1, -1);
    expect(p.x).toBeGreaterThan(0.9);
    expect(p.z).toBeGreaterThan(0.25);
  });
  it('blocks bench/planter volumes and permits the clear approach', () => {
    expect(isBlocked(-8, 5)).toBe(true);
    expect(isBlocked(17.5, 3)).toBe(true);
    expect(isBlocked(0, 2)).toBe(false);
  });
  it('protects the renovated terrace steps, columns, perimeter planting and lamp bases', () => {
    expect(isBlocked(11, 0.2)).toBe(true);
    expect(isBlocked(-22, -4)).toBe(true);
    expect(isBlocked(4.7, 2.3)).toBe(true);
    expect(isBlocked(18, 11)).toBe(true);
    expect(isBlocked(-5, 9.3)).toBe(true);
    expect(isBlocked(0, 18)).toBe(false);
  });
  it('opens continuous city routes but retains real parcels, beds and developed edges', () => {
    expect(isBlocked(3, 18)).toBe(false);
    expect(isBlocked(8, 18)).toBe(true);
    expect(isBlocked(15, 28)).toBe(false);
    expect(isBlocked(0, 37)).toBe(false);
    expect(isBlocked(-24, -20)).toBe(false);
    expect(isBlocked(-43, -12)).toBe(true);
    expect(isBlocked(57, 28)).toBe(true);
    expect(isBlocked(0, 75)).toBe(true);
  });
  it('meets nominal ramp and road heights continuously', () => {
    expect(groundHeight(22.2)).toBe(0);
    expect(groundHeight(23.1)).toBeCloseTo(-0.075);
    expect(groundHeight(24)).toBeCloseTo(-0.15);
    expect(groundHeight(30)).toBeCloseTo(-0.15);
    expect(groundHeight(10, 29)).toBeCloseTo(-0.15);
    expect(groundHeight(-36, 0)).toBeCloseTo(-0.15);
    expect(groundHeight(37, 0)).toBe(0);
  });
  it('connects spawn to both streets, rear crossing and southern blocks without teleporting', () => {
    let p = { ...SPAWN };
    for (const goal of [
      { x: 0, z: 39 },
      { x: -29, z: 39 },
      { x: -29, z: -42 },
      { x: 29, z: -42 },
      { x: 29, z: 68 },
      { x: 0, z: 68 },
      { x: 0, z: 38 },
    ]) {
      for (let n = 0; n < 2000; n++) {
        const dx = goal.x - p.x,
          dz = goal.z - p.z,
          L = Math.hypot(dx, dz);
        if (L < 0.12) break;
        p = moveWithCollision(p, (dx / L) * 0.12, (dz / L) * 0.12);
        expect(isBlocked(p.x, p.z)).toBe(false);
      }
      expect(Math.hypot(p.x - goal.x, p.z - goal.z)).toBeLessThan(0.15);
    }
  });
  it('does not exceed the site boundary with large diagonal input', () => {
    const p = moveWithCollision({ x: 20, z: 10 }, 200, 200);
    expect(p.x).toBeLessThanOrEqual(57);
    expect(p.z).toBeLessThanOrEqual(74);
  });
});
