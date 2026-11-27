import { describe, it, expect } from 'vitest';
import { StableCameraRig } from './stableCamera';
const p = { x: 0, y: 0, z: 18 };
const clear = (a: typeof p, b: typeof p) =>
  Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
describe('single-owner persistent orbit rig', () => {
  it('has time-partition-independent angle integration', () => {
    const a = new StableCameraRig(),
      b = new StableCameraRig();
    a.drag(200, 40);
    b.drag(200, 40);
    for (let n = 0; n < 60; n++) a.rotate(1 / 60);
    for (let n = 0; n < 30; n++) b.rotate(1 / 30);
    expect(a.yaw.value).toBeCloseTo(b.yaw.value, 10);
    expect(a.pitch.value).toBeCloseTo(b.pitch.value, 10);
  });
  it('does not alternate between rendered and requested distances', () => {
    const r = new StableCameraRig();
    r.zoom(400);
    for (let n = 0; n < 60; n++) {
      const q = r.resolve(p, 1 / 60, () => 3);
      expect(r.arm.value).toBe(3);
      expect(
        Math.hypot(
          q.end.x - q.target.x,
          q.end.y - q.target.y,
          q.end.z - q.target.z,
        ),
      ).toBeCloseTo(r.arm.value, 10);
    }
    expect(r.requestedArm).toBeGreaterThan(7.4);
  });
  it('uses contact hysteresis instead of pumping around a thin edge', () => {
    const r = new StableCameraRig();
    r.resolve(p, 0.016, () => 3);
    for (let n = 0; n < 100; n++) r.resolve(p, 0.016, () => (n % 2 ? 3 : 3.08));
    expect(r.arm.value).toBeCloseTo(3);
    for (let n = 0; n < 120; n++) r.resolve(p, 0.016, clear);
    expect(r.arm.value).toBeGreaterThan(7.3);
  });
  it('zooms smoothly without treating a wheel request as a collision', () => {
    const r = new StableCameraRig();
    r.zoom(-1000);
    r.resolve(p, 0.016, clear);
    expect(r.arm.value).toBeGreaterThan(r.requestedArm);
    expect(r.arm.value).toBeLessThan(7.4);
  });
  it('resets all angular, target and arm velocity without a leftover correction', () => {
    const r = new StableCameraRig();
    r.drag(200, 100);
    r.rotate(0.05);
    r.resolve({ x: 15, y: 0, z: 10 }, 0.05, () => 2);
    r.reset(p);
    const q = r.resolve(p, 0.016, clear);
    expect(r.yaw.value).toBe(Math.PI / 2);
    expect(r.arm.value).toBeCloseTo(7.4, 10);
    expect(q.target).toEqual({ x: 0, y: 1.6, z: 18 });
  });
});
