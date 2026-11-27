// Deliberately avoid the core barrel: keep optional engine/audio/XR systems out.
export { Scene } from '@babylonjs/core/scene';
export { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
export { Vector3 } from '@babylonjs/core/Maths/math.vector';
export { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
export { Scalar } from '@babylonjs/core/Maths/math.scalar';
export { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
export { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
export { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
export { RawCubeTexture } from '@babylonjs/core/Materials/Textures/rawCubeTexture';
export { Texture } from '@babylonjs/core/Materials/Textures/texture';
export { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
export { Constants } from '@babylonjs/core/Engines/constants';
export { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
export { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
export type { Material } from '@babylonjs/core/Materials/material';
export { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
export { Mesh } from '@babylonjs/core/Meshes/mesh';
export { TransformNode } from '@babylonjs/core/Meshes/transformNode';
export { Ray } from '@babylonjs/core/Culling/ray';
export { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
export { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';

export { SphericalPolynomial } from '@babylonjs/core/Maths/sphericalPolynomial';
import '@babylonjs/core/Materials/Textures/baseTexture.polynomial';

export { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader';
export { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe';
export { SSAO2RenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline';
import '@babylonjs/core/Rendering/geometryBufferRendererSceneComponent';
import '@babylonjs/core/Engines/Extensions/engine.multiRender';
import '@babylonjs/core/Engines/WebGPU/Extensions/engine.multiRender';
export { FxaaPostProcess } from '@babylonjs/core/PostProcesses/fxaaPostProcess';
