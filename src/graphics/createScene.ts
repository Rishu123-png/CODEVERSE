import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';

export function createScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(11 / 255, 16 / 255, 24 / 255, 1);
  // A non-interactive camera is required by Babylon's render pipeline.
  // No meshes, terrain, lights, materials, textures, or gameplay are created.
  scene.activeCamera = new FreeCamera(
    'foundation-camera',
    Vector3.Zero(),
    scene,
  );
  return scene;
}
