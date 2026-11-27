import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { expect, it } from 'vitest';
import { createScene } from './createScene';

it('creates only the required non-interactive camera and empty clear surface', () => {
  const engine = new NullEngine();
  const scene = createScene(engine);
  try {
    expect(scene.meshes).toHaveLength(0);
    expect(scene.lights).toHaveLength(0);
    expect(scene.materials).toHaveLength(0);
    expect(scene.textures).toHaveLength(0);
    expect(scene.cameras).toHaveLength(1);
    expect(scene.activeCamera?.name).toBe('foundation-camera');
    expect(scene.clearColor.asArray()).toEqual([
      11 / 255,
      16 / 255,
      24 / 255,
      1,
    ]);
    expect(() => scene.render()).not.toThrow();
  } finally {
    scene.dispose();
    engine.dispose();
  }
});
