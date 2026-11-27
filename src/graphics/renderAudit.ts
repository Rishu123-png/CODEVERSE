import type { Scene } from '@babylonjs/core/scene';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';

// Explicit opt-in diagnostic hook for browser investigation, never enabled by default.
export function installRenderAudit(scene: Scene): () => void {
  if (!new URLSearchParams(window.location.search).has('renderAudit'))
    return () => {};
  window.__renderScene = scene;
  window.__renderAudit = () => ({
    ready: scene.isReady(),
    engine: scene.getEngine().getClassName(),
    imageProcessing: {
      exposure: scene.imageProcessingConfiguration.exposure,
      contrast: scene.imageProcessingConfiguration.contrast,
      toneMapping: scene.imageProcessingConfiguration.toneMappingEnabled,
    },
    lights: scene.lights.map((l) => ({
      name: l.name,
      enabled: l.isEnabled(),
      intensity: l.intensity,
      diffuse: l.diffuse.asArray(),
      excluded: l.excludedMeshes.length,
    })),
    environment: scene.environmentTexture
      ? {
          name: scene.environmentTexture.name,
          ready: scene.environmentTexture.isReady(),
          gammaSpace: scene.environmentTexture.gammaSpace,
          irradiance: !!scene.environmentTexture.sphericalPolynomial,
          intensity: scene.environmentIntensity,
        }
      : null,
    materials: scene.materials.map((m) => ({
      name: m.name,
      type: m.getClassName(),
      backFaceCulling: m.backFaceCulling,
      ...(m instanceof PBRMaterial
        ? {
            albedo: m.albedoColor.asArray(),
            metallic: m.metallic,
            roughness: m.roughness,
            unlit: m.unlit,
            lightingIntensity: m.directIntensity,
            environmentIntensity: m.environmentIntensity,
            albedoTexture: m.albedoTexture?.name,
          }
        : {}),
    })),
    textures: scene.textures.map((t) => ({
      name: t.name,
      ready: t.isReady(),
      gammaSpace: t.gammaSpace,
      size: t.getSize(),
    })),
    meshes: scene.meshes
      .filter((m) => m.getTotalVertices() > 0)
      .map((m) => ({
        name: m.name,
        material: m.material?.name,
        vertices: m.getTotalVertices(),
        normals: m.isVerticesDataPresent('normal'),
        ready: m.isReady(true),
        effectError: m.subMeshes
          ?.map((s) => s.effect?.getCompilationError())
          .filter(Boolean),
      })),
  });
  return () => {
    delete window.__renderScene;
    delete window.__renderAudit;
  };
}

declare global {
  interface Window {
    __renderScene?: Scene;
    __renderAudit?: () => unknown;
  }
}
