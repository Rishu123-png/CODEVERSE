import { describe, expect, it } from 'vitest';
import { canopyClearance, type CanopyVolume } from './cameraClearance';
const origin = { x: 0, y: 2, z: 0 };
const end = { x: 0, y: 2, z: 10 };
const crown: CanopyVolume = {
  center: { x: 0, y: 2, z: 6 },
  radius: { x: 2, y: 1, z: 2 },
};
describe('finite camera-arm foliage clearance', () => {
  it('keeps the full arm when unobstructed or foliage is beyond the camera', () => {
    expect(canopyClearance(origin, end, [])).toBe(10);
    expect(
      canopyClearance(origin, end, [
        { ...crown, center: { x: 0, y: 2, z: 20 } },
      ]),
    ).toBe(10);
  });
  it('shortens before the near surface, with collision padding', () => {
    expect(canopyClearance(origin, end, [crown])).toBeCloseTo(3.44);
  });
  it('uses the closest crown regardless of insertion order', () => {
    const near = { ...crown, center: { x: 0, y: 2, z: 4 } };
    expect(canopyClearance(origin, end, [crown, near])).toBeCloseTo(1.44);
    expect(canopyClearance(origin, end, [near, crown])).toBeCloseTo(1.44);
  });
  it('leaves high crowns and off-axis trees alone', () => {
    expect(
      canopyClearance(origin, end, [
        { ...crown, center: { x: 0, y: 8, z: 6 } },
      ]),
    ).toBe(10);
    expect(
      canopyClearance(origin, end, [
        { ...crown, center: { x: 6, y: 2, z: 6 } },
      ]),
    ).toBe(10);
  });
  it('is finite at zero length and when the target is already within a crown', () => {
    expect(canopyClearance(origin, origin, [crown])).toBe(0);
    expect(canopyClearance(crown.center, end, [crown])).toBe(4);
  });
});
