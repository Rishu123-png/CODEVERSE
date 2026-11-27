import * as B from './babylon';
import { StableCameraRig } from './stableCamera';
import { STREET_TREES, ACCENT_TREES } from './districtLayout';
import { canopyClearance, type CanopyVolume } from './cameraClearance';
import '@babylonjs/loaders/glTF';
import { checkAborted } from '../graphics/rendererPolicy';
import {
  SPAWN,
  moveWithCollision,
  groundHeight,
  nearEntrance,
} from './movement';

import { INITIAL_GAME_STATE, type GameState } from './state';
import { installRenderAudit } from '../graphics/renderAudit';
export async function createGame(
  scene: B.Scene,
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<() => void> {
  let disposed = false;
  const keys = new Set<string>();
  const listeners: Array<() => void> = [];
  const on = (target: EventTarget, name: string, fn: EventListener) => {
    target.addEventListener(name, fn);
    listeners.push(() => target.removeEventListener(name, fn));
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    listeners.splice(0).forEach((f) => f());
    keys.clear();
  };
  signal.addEventListener('abort', dispose, { once: true });
  listeners.push(() => signal.removeEventListener('abort', dispose));
  try {
    checkAborted(signal);
    scene.useRightHandedSystem = true;
    scene.clearColor = new B.Color4(0.57, 0.68, 0.76, 1);
    scene.fogMode = B.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.004;
    scene.fogColor = new B.Color3(0.57, 0.68, 0.76);
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType =
      B.ImageProcessingConfiguration.TONEMAPPING_ACES;
    scene.imageProcessingConfiguration.exposure = 1.05;
    scene.imageProcessingConfiguration.contrast = 1.05;
    const oldCamera = scene.activeCamera;
    const camera = new B.ArcRotateCamera(
      'third-person',
      Math.PI / 2,
      1.61,
      7.4,
      new B.Vector3(SPAWN.x, 1.6, SPAWN.z),
      scene,
    );
    scene.activeCamera = camera;
    oldCamera?.dispose();
    camera.fov = (68 * Math.PI) / 180;
    camera.minZ = 0.08;
    camera.maxZ = 280;
    camera.lowerRadiusLimit = 0.35;
    camera.upperRadiusLimit = 18;
    camera.lowerBetaLimit = 0.5;
    camera.upperBetaLimit = 1.67;
    camera.wheelPrecision = 30;
    camera.panningSensibility = 0;
    camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
    // ArcRotate supplies projection/view only. No native inertia/zoom controller
    // is attached: the persistent rig below is the sole camera-state owner.
    camera.detachControl();
    const rig = new StableCameraRig();
    let drag: { id: number; x: number; y: number } | undefined;
    on(canvas, 'pointerdown', ((e: PointerEvent) => {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      canvas.focus();
      e.preventDefault();
    }) as EventListener);
    on(canvas, 'pointermove', ((e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      rig.drag(e.clientX - drag.x, e.clientY - drag.y);
      drag.x = e.clientX;
      drag.y = e.clientY;
    }) as EventListener);
    const release = () => {
      drag = undefined;
    };
    on(canvas, 'pointerup', release);
    on(canvas, 'pointercancel', release);
    on(canvas, 'lostpointercapture', release);
    on(canvas, 'wheel', ((e: WheelEvent) => {
      e.preventDefault();
      rig.zoom(e.deltaY);
    }) as EventListener);
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'CodeVerse playable third-person world');
    const sky = new B.HemisphericLight(
      'daylight sky',
      new B.Vector3(0.1, 1, 0.3),
      scene,
    );
    sky.intensity = 0.38;
    sky.groundColor = new B.Color3(0.21, 0.23, 0.25);
    const sun = new B.DirectionalLight(
      'afternoon sun',
      new B.Vector3(-0.85, -1, -0.55),
      scene,
    );
    sun.position = new B.Vector3(36, 43, 25);
    sun.intensity = 1.85;
    sun.diffuse = new B.Color3(1, 0.92, 0.8);
    const shadow = new B.ShadowGenerator(2048, sun);
    shadow.usePercentageCloserFiltering = true;
    shadow.filteringQuality = B.ShadowGenerator.QUALITY_MEDIUM;
    shadow.bias = 0.001;
    shadow.normalBias = 0.035;
    // Keep a player-centred local sun footprint, not the distant skyline or
    // full district extent. Auto-fitting those huge batches caused visible acne.
    sun.autoUpdateExtends = false;
    sun.orthoLeft = -36;
    sun.orthoRight = 36;
    sun.orthoBottom = -36;
    sun.orthoTop = 36;
    sun.shadowOrthoScale = 0;
    sun.shadowMinZ = 0.1;
    sun.shadowMaxZ = 180;
    const shadowDirection = sun.direction.normalizeToNew();
    const shadowRight = B.Vector3.Cross(
      B.Vector3.Up(),
      shadowDirection,
    ).normalize();
    const shadowUp = B.Vector3.Cross(shadowDirection, shadowRight).normalize();
    // Original directionally consistent cloud sky: same radiance in background/reflections.
    const size = 128,
      faces = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const response = await fetch(`/assets/g1/v2-sky-${i}.rgba`, {
            signal,
          });
          if (!response.ok)
            throw new Error(`Sky texture ${i} failed: ${response.status}`);
          return new Uint8Array(await response.arrayBuffer());
        }),
      );
    checkAborted(signal);
    const env = new B.RawCubeTexture(
      scene,
      faces,
      size,
      B.Constants.TEXTUREFORMAT_RGBA,
      B.Constants.TEXTURETYPE_UNSIGNED_BYTE,
      true,
      false,
      B.Texture.TRILINEAR_SAMPLINGMODE,
    );
    env.name = 'original procedural sky reflection';
    scene.environmentTexture = env;
    env.gammaSpace = true;
    const irradiance = new B.SphericalPolynomial();
    for (const coefficient of [irradiance.xx, irradiance.yy, irradiance.zz])
      coefficient.set(0.2, 0.255, 0.34);
    irradiance.y.set(0.035, 0.055, 0.085);
    env.sphericalPolynomial = irradiance;
    const daylight = await new Promise<B.CubeTexture>((resolve, reject) => {
      const texture = new B.CubeTexture(
        '/assets/g1/daylight-urban.env',
        scene,
        {
          prefiltered: true,
          createPolynomials: true,
          onLoad: () => resolve(texture),
          onError: (message) =>
            reject(new Error(message || 'Daylight environment failed')),
        },
      );
    });
    checkAborted(signal);
    daylight.name = 'Poly Haven pedestrian overpass CC0 daylight';
    scene.environmentTexture = daylight;
    scene.environmentIntensity = 0.8;
    const skyMaterial = new B.StandardMaterial(
      'original cloud sky background',
      scene,
    );
    skyMaterial.backFaceCulling = false;
    skyMaterial.disableLighting = true;
    skyMaterial.diffuseColor = B.Color3.Black();
    skyMaterial.specularColor = B.Color3.Black();
    skyMaterial.reflectionTexture = env.clone();
    skyMaterial.reflectionTexture.coordinatesMode = B.Texture.SKYBOX_MODE;
    skyMaterial.disableDepthWrite = true;
    const skyBox = B.MeshBuilder.CreateBox(
      'original cloud skybox',
      { size: 300 },
      scene,
    );
    skyBox.material = skyMaterial;
    skyBox.isPickable = false;
    skyBox.infiniteDistance = true;
    skyBox.applyFog = false;
    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 110;

    const material = (name: string, color: string, rough = 0.8, metal = 0) => {
      const m = new B.PBRMaterial(name, scene);
      m.albedoColor = B.Color3.FromHexString(color);
      m.roughness = rough;
      m.metallic = metal;
      return m;
    };
    const stone = material('original architectural edge', '#a5a7a4'),
      accent = material('CodeVerse blue', '#146ddd', 0.4, 0.25);
    accent.emissiveColor = new B.Color3(0.01, 0.12, 0.5);
    function box(
      name: string,
      center: number[],
      dims: number[],
      mat: B.Material,
    ) {
      const m = B.MeshBuilder.CreateBox(
        name,
        { width: dims[0], height: dims[1], depth: dims[2] },
        scene,
      );
      m.position.set(center[0], center[1], center[2]);
      m.material = mat;
      m.receiveShadows = true;
      shadow.addShadowCaster(m);
      return m;
    }
    const base = box(
      'constructed site plinth',
      [0, -0.16, -6],
      [48, 0.3, 36],
      stone,
    );
    base.isPickable = false;
    // Rear/side service apron and intentionally bounded planted edge.
    const ground = material('original planted verge', '#435344');
    box('rear verge', [0, -0.1, -26], [47, 0.18, 2], ground);
    // A modest landscape context, not a fabricated surrounding city.
    const contextGround = box(
      'bounded site landscape context',
      [0, -0.43, 0],
      [240, 0.12, 240],
      ground,
    );
    contextGround.isPickable = false;
    contextGround.receiveShadows = false;
    shadow.removeShadowCaster(contextGround);

    const load = async (file: string) => {
      const container = await B.LoadAssetContainerAsync(
        '/assets/g1/' + file,
        scene,
      );
      if (signal.aborted || disposed) {
        container.dispose();
        checkAborted(signal);
        throw new Error('Scene loading cancelled');
      }
      container.addAllToScene();
      return container;
    };
    const landmark = await load('landmark-v2.glb');
    for (const m of landmark.meshes) {
      m.receiveShadows = true;
      if (m.getTotalVertices()) shadow.addShadowCaster(m);
      m.isPickable = true;
    }
    for (const m of landmark.meshes) {
      if (
        /^(front:|left:|right:|rear:|roof:|entry:|plaza:|link:paving|road:|props:)/.test(
          m.name,
        )
      ) {
        m.setEnabled(false);
        shadow.removeShadowCaster(m);
      }
    }
    const renovation = await load('site-v3.glb');
    for (const m of renovation.meshes) {
      m.receiveShadows = true;
      const landscape = m.name.includes('landscape context');
      m.isPickable =
        !landscape &&
        !/paving|stone units|wearing course|road|sidewalk|coursing/.test(
          m.name,
        );
      const contextOrGround =
        /^(context |contoured |aggregate road|continuous road|north sidewalk|south sidewalk|approach stone|limestone paving|pedestrian crossing)/.test(
          m.name,
        );
      if (m.getTotalVertices() && !landscape && !contextOrGround)
        shadow.addShadowCaster(m);
    }
    contextGround.setEnabled(false);
    function textPlane(
      name: string,
      text: string,
      width: number,
      height: number,
      position: B.Vector3,
      fontSize: number,
      color = '#e8f2ff',
    ) {
      const texture = new B.DynamicTexture(
        name,
        { width: text.length === 1 ? 256 : 2048, height: 256 },
        scene,
        false,
      );
      texture.hasAlpha = true;
      const context = texture.getContext();
      context.clearRect(0, 0, text.length === 1 ? 256 : 2048, 256);
      texture.drawText(
        text,
        null,
        205,
        `600 ${Math.min(230, fontSize * 3)}px sans-serif`,
        color,
        'transparent',
        true,
        true,
      );
      const m = new B.StandardMaterial(name, scene);
      m.diffuseTexture = texture;
      m.emissiveTexture = texture;
      m.useAlphaFromDiffuseTexture = true;
      m.backFaceCulling = false;
      m.disableLighting = true;
      const plane = B.MeshBuilder.CreatePlane(
        name,
        { width, height, sideOrientation: B.Mesh.DOUBLESIDE },
        scene,
      );
      plane.position.copyFrom(position);
      plane.material = m;
      plane.rotation.y = 0;
      plane.isPickable = false;
      return plane;
    }
    textPlane(
      'original CodeVerse wordmark',
      'CODEVERSE',
      7.7,
      0.97,
      new B.Vector3(0, 11.65, 1.37),
      94,
    );
    textPlane(
      'learning city sign',
      'LEARNING CITY',
      6.4,
      0.5,
      new B.Vector3(0, 10.65, 1.37),
      48,
      '#62baff',
    );
    textPlane(
      'entrance wayfinding',
      'CENTRAL PLAZA  /  WELCOME',
      5.8,
      0.38,
      new B.Vector3(0, 3.72, 0.16),
      58,
      '#e1d7bd',
    );
    box('entry left accent', [-4.25, 1.8, 0.18], [0.035, 3.5, 0.08], accent);
    box('entry right accent', [4.25, 1.8, 0.18], [0.035, 3.5, 0.08], accent);
    for (const x of [-4.25, 4.25])
      box('front plaza inlay ' + x, [x, 0.008, 6], [0.055, 0.012, 9], accent);
    // New authored dense canopies; shared meshes/materials and true cutout foliage.
    const crowns: CanopyVolume[] = [];
    async function planting(file: string, placements: number[][]) {
      const container = await load(file);
      const place = (roots: B.TransformNode[], p: number[]) => {
        for (const root of roots) {
          root.position.set(p[0], p[1], p[2]);
          root.scaling.set(p[3], p[3] * (p[5] ?? 1), p[3]);
          root.rotation.y = p[4] ?? 0;
          root.computeWorldMatrix(true);
          if (!file.includes('underplanting')) {
            // Broad-phase leaf crowns alone miss the narrow lower trunk.
            // Analytic trunk clearance keeps orbit rays out of bark without
            // triangle-picking every instanced botanical mesh.
            crowns.push({
              center: new B.Vector3(p[0], p[1] + 2 * p[3], p[2]),
              radius: new B.Vector3(0.25 * p[3], 2.25 * p[3], 0.25 * p[3]),
            });
            for (const leaf of root
              .getChildMeshes()
              .filter((m) => m.name.startsWith('leaves'))) {
              leaf.computeWorldMatrix(true);
              const bounds = leaf.getBoundingInfo().boundingBox;
              const center = bounds.minimumWorld
                .add(bounds.maximumWorld)
                .scale(0.5);
              const radius = bounds.maximumWorld
                .subtract(bounds.minimumWorld)
                .scale(0.5);
              crowns.push({ center, radius });
            }
          }
        }
      };
      place(container.rootNodes as B.TransformNode[], placements[0]);
      for (let i = 1; i < placements.length; i++) {
        const copy = container.instantiateModelsToScene(
          (n) => n + '-' + file + '-' + i,
          false,
          { doNotInstantiate: false },
        );
        place(copy.rootNodes as B.TransformNode[], placements[i]);
      }
      for (const m of scene.meshes)
        if (m.material && container.materials.includes(m.material)) {
          m.isPickable = false;
          m.receiveShadows = true;
          shadow.addShadowCaster(m);
        }
      for (const m of container.materials)
        if (m instanceof B.PBRMaterial) m.twoSidedLighting = true;
    }
    await planting('canopy-v3.glb', [
      [-17.5, 0.55, 3, 1, 0.4],
      [17.5, 0.55, 3, 1.05, 2.4],
      [-22, 0.55, -12, 0.8, 1.3],
      [22, 0.55, -12, 0.85, 3.2],
      [-22, 0.55, 9, 0.8, 4.8],
      [22, 0.55, 9, 0.82, 0.5],
      ...ACCENT_TREES.slice(0, 10).map(([x, z], i) => [
        x,
        0,
        z,
        0.9 + (i % 3) * 0.1,
        i * 1.7,
      ]),
      ...STREET_TREES.filter((_, i) => i % 2 === 0).map(([x, z], i) => [
        x,
        0.08,
        z,
        0.85 + (i % 3) * 0.09,
        i * 1.71,
      ]),
    ]);
    await planting('oak-v3.glb', [
      [-22, 0.55, -4, 0.93, 1.7],
      [22, 0.55, -4, 0.95, 3.8],
      ...ACCENT_TREES.slice(10).map(([x, z], i) => [x, 0, z, 0.95, i * 2.1]),
      ...STREET_TREES.filter((_, i) => i % 2 === 1).map(([x, z], i) => [
        x,
        0.08,
        z,
        0.82 + (i % 3) * 0.08,
        i * 2.1,
      ]),
    ]);
    await planting('blossom-v3.glb', [[12, 0.55, 8.5, 0.95, 2]]);
    const low: number[][] = [];
    for (const [x, z] of [
      [-17.5, 3],
      [17.5, 3],
      [12, 8.5],
      [-22, -12],
      [22, -12],
      [-22, -4],
      [22, -4],
      [-22, 9],
      [22, 9],
    ])
      for (let i = 0; i < 3; i++)
        low.push([
          x + Math.cos(i * 2.1) * 0.7,
          0.55,
          z + Math.sin(i * 2.1) * 0.7,
          0.48 + (i % 2) * 0.13,
          i * 1.8,
        ]);
    for (const side of [-1, 1])
      for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++) {
          const jitter = Math.sin(row * 37 + col * 13 + side * 7);
          low.push([
            side * (5.0 + col * 0.86) + jitter * 0.18,
            0.27,
            14.4 + row * 1.02 + Math.cos(col * 31 + row) * 0.2,
            0.72 + (jitter + 1) * 0.17,
            row * 1.7 + col * 0.8,
          ]);
        }
    await planting('underplanting-v3.glb', low);
    const player = await load('hero-urban.glb');
    const playerRoot = new B.TransformNode('player-controller', scene);
    for (const n of [...player.rootNodes]) n.parent = playerRoot;
    playerRoot.position.set(SPAWN.x, 0, SPAWN.z);
    playerRoot.rotation.y = Math.PI;
    for (const m of player.meshes) {
      shadow.addShadowCaster(m);
      m.receiveShadows = true;
      m.isPickable = false;
    }
    const clips = Object.fromEntries(
      player.animationGroups.map((g) => [g.name, g]),
    );
    Object.values(clips).forEach((g) => {
      g.stop();
      g.enableBlending = true;
      g.blendingSpeed = 0.1;
    });
    let active = 'Idle';
    // Begin in the sampled idle pose, not a blend from the exported bind pose.
    // Subsequent idle/walk/run changes retain the existing blending policy.
    if (clips.Idle) {
      clips.Idle.enableBlending = false;
      clips.Idle.start(true);
      clips.Idle.goToFrame(clips.Idle.from);
      clips.Idle.enableBlending = true;
    }
    const glazing = scene.materials.filter(
      (m) =>
        m instanceof B.PBRMaterial && /neutral low iron glazing/.test(m.name),
    ) as B.PBRMaterial[];
    const probe = new B.ReflectionProbe(
      'actual plaza facade reflection',
      256,
      scene,
      true,
      true,
      true,
    );
    probe.position.set(0, 4.5, 3);
    probe.renderList = scene.meshes.filter(
      (m) =>
        m.isEnabled() &&
        !player.meshes.includes(m) &&
        !glazing.includes(m.material as B.PBRMaterial),
    );
    probe.refreshRate = 0;
    probe.cubeTexture.sphericalPolynomial = daylight.sphericalPolynomial;
    for (const m of glazing) {
      m.metallic = 0;
      m.indexOfRefraction = 1.52;
      m.useRadianceOverAlpha = true;
      m.useSpecularOverAlpha = true;
      m.reflectionTexture = probe.cubeTexture;
      for (const mesh of scene.meshes)
        if (mesh.material === m) shadow.removeShadowCaster(mesh);
    }
    const ao = new B.SSAO2RenderingPipeline(
      'plaza contact occlusion',
      scene,
      { ssaoRatio: 0.5, blurRatio: 1 },
      [camera],
      true,
    );
    ao.radius = 0.65;
    ao.totalStrength = 0.65;
    ao.base = 0.8;
    ao.samples = 16;
    ao.bilateralSoften = 1.0;
    ao.bilateralTolerance = 0.15;
    ao.expensiveBlur = true;
    const fxaa = new B.FxaaPostProcess('final edge antialiasing', 1, camera);
    listeners.push(() => fxaa.dispose());
    listeners.push(
      () => ao.dispose(),
      () => probe.dispose(),
    );
    const ring = B.MeshBuilder.CreateTorus(
      'entrance information marker',
      { diameter: 1.1, thickness: 0.035, tessellation: 48 },
      scene,
    );
    ring.position.set(0, 0.035, 1.8);
    ring.material = accent;
    ring.isPickable = false;
    textPlane(
      'information marker glyph',
      'i',
      0.3,
      0.4,
      new B.Vector3(0, 1.65, 1.8),
      170,
      '#80c6ff',
    );
    let state: GameState = { ...INITIAL_GAME_STATE },
      phase = 0,
      lastNotify = 0,
      velocity = 0;
    const publish = () => {
      window.dispatchEvent(
        new CustomEvent<GameState>('codeverse:state', { detail: { ...state } }),
      );
    };
    const reset = () => {
      playerRoot.position.set(SPAWN.x, 0, SPAWN.z);
      playerRoot.rotation.y = Math.PI;
      velocity = 0;
      state = { ...INITIAL_GAME_STATE };
      rig.reset(playerRoot.position);
      camera.setTarget(new B.Vector3(SPAWN.x, 1.6, SPAWN.z), false, true, true);
      camera.alpha = rig.yaw.value;
      camera.beta = rig.pitch.value;
      camera.radius = rig.arm.value;
      keys.clear();
      publish();
    };
    on(canvas, 'pointerdown', () => canvas.focus());
    on(window, 'blur', () => {
      keys.clear();
      state.paused = true;
      publish();
    });
    on(document, 'visibilitychange', () => {
      keys.clear();
      if (document.hidden) {
        state.paused = true;
        publish();
      }
    });
    on(window, 'keydown', ((event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      const key = event.key.toLowerCase();
      if (
        [
          'w',
          'a',
          's',
          'd',
          'arrowup',
          'arrowdown',
          'arrowleft',
          'arrowright',
          ' ',
          'shift',
          'e',
          'escape',
          'r',
        ].includes(key)
      )
        event.preventDefault();
      if (!event.repeat) {
        if (key === 'r') reset();
        if (key === 'escape') {
          if (state.interacting) state.interacting = false;
          else state.paused = !state.paused;
          keys.clear();
          publish();
        }
        if (key === 'e' && !state.paused) {
          if (state.interacting) state.interacting = false;
          else if (nearEntrance(playerRoot.position)) state.interacting = true;
          publish();
        }
      }
      keys.add(key);
    }) as EventListener);
    on(window, 'keyup', ((e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    }) as EventListener);
    on(window, 'codeverse:resume', () => {
      state.paused = false;
      state.interacting = false;
      keys.clear();
      canvas.focus();
      publish();
    });
    on(window, 'codeverse:reset', reset);
    on(window, 'codeverse:dismiss', () => {
      state.interacting = false;
      keys.clear();
      canvas.focus();
      publish();
    });
    const update = () => {
      if (disposed) return;
      const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
      phase += dt;
      rig.rotate(dt);
      let inputX = 0,
        inputZ = 0;
      if (!state.paused && !state.interacting) {
        inputZ =
          Number(keys.has('w') || keys.has('arrowup')) -
          Number(keys.has('s') || keys.has('arrowdown'));
        inputX =
          Number(keys.has('d') || keys.has('arrowright')) -
          Number(keys.has('a') || keys.has('arrowleft'));
      }
      const magnitude = Math.hypot(inputX, inputZ);
      const target = magnitude ? (keys.has('shift') ? 4.1 : 1.65) : 0;
      velocity = B.Scalar.Lerp(velocity, target, 1 - Math.exp(-dt * 12));
      const before = playerRoot.position.clone();
      if (magnitude && velocity > 0.01) {
        inputX /= magnitude;
        inputZ /= magnitude;
        const dx =
            (-Math.cos(rig.yaw.value) * inputZ +
              Math.sin(rig.yaw.value) * inputX) *
            velocity *
            dt,
          dz =
            (-Math.sin(rig.yaw.value) * inputZ -
              Math.cos(rig.yaw.value) * inputX) *
            velocity *
            dt;
        const next = moveWithCollision(playerRoot.position, dx, dz);
        playerRoot.position.x = next.x;
        playerRoot.position.z = next.z;
        const desired = Math.atan2(dx, dz),
          delta = Math.atan2(
            Math.sin(desired - playerRoot.rotation.y),
            Math.cos(desired - playerRoot.rotation.y),
          );
        playerRoot.rotation.y += delta * (1 - Math.exp(-dt * 14));
      }
      const actual =
        B.Vector3.Distance(before, playerRoot.position) / Math.max(dt, 0.001);
      playerRoot.position.y = groundHeight(
        playerRoot.position.z,
        playerRoot.position.x,
      );
      const motion =
        actual > 0.15 ? (keys.has('shift') ? 'Run' : 'Walk') : 'Idle';
      if (active !== motion) {
        clips[active]?.stop();
        clips[motion]?.start(true);
        active = motion;
      }
      for (const group of Object.values(clips))
        group.speedRatio =
          state.paused || state.interacting
            ? 0
            : group.name === 'Walk'
              ? Math.max(0.2, actual / 1.012)
              : group.name === 'Run'
                ? Math.max(0.2, actual / 2.88)
                : 1;
      const texel = 72 / 2048;
      const alongRight =
        Math.round(B.Vector3.Dot(playerRoot.position, shadowRight) / texel) *
        texel;
      const alongUp =
        Math.round(B.Vector3.Dot(playerRoot.position, shadowUp) / texel) *
        texel;
      const alongDepth =
        B.Vector3.Dot(playerRoot.position, shadowDirection) - 80;
      sun.position.copyFrom(
        shadowRight
          .scale(alongRight)
          .add(shadowUp.scale(alongUp))
          .add(shadowDirection.scale(alongDepth)),
      );
      const pose = rig.resolve(playerRoot.position, dt, (origin, end) => {
        const targetPoint = new B.Vector3(origin.x, origin.y, origin.z),
          endPoint = new B.Vector3(end.x, end.y, end.z);
        let allowed = canopyClearance(origin, end, crowns, 0.32);
        const delta = endPoint.subtract(targetPoint),
          length = delta.length(),
          direction = delta.normalize();
        const right = new B.Vector3(
          Math.sin(rig.yaw.value),
          0,
          -Math.cos(rig.yaw.value),
        );
        for (const side of [-1, 0, 1]) {
          const offset = right.scale(side * 0.23);
          offset.y = side === 0 ? 0 : 0.15;
          const pick = scene.pickWithRay(
            new B.Ray(targetPoint.add(offset), direction, length),
            (m) => m.isPickable && m.isEnabled() && m.getTotalVertices() > 0,
          );
          if (pick?.hit)
            allowed = Math.min(allowed, Math.max(0.35, pick.distance - 0.28));
        }
        return allowed;
      });
      camera.setTarget(
        new B.Vector3(pose.target.x, pose.target.y, pose.target.z),
        false,
        true,
        true,
      );
      camera.alpha = rig.yaw.value;
      camera.beta = rig.pitch.value;
      camera.radius = rig.arm.value;
      state = {
        ...state,
        x: playerRoot.position.x,
        z: playerRoot.position.z,
        speed: actual,
        near: nearEntrance(playerRoot.position),
        motion,
      };
      ring.scaling.setAll(1 + Math.sin(phase * 2) * 0.04);
      if (phase - lastNotify > 0.15) {
        lastNotify = phase;
        publish();
      }
      if (import.meta.env.DEV) {
        window.__CODEVERSE__ = {
          ...state,
          playerY: playerRoot.position.y,
          cameraAlpha: camera.alpha,
          cameraRadius: camera.radius,
          meshes: scene.meshes.length,
          skeletons: scene.skeletons.length,
          animationGroups: scene.animationGroups.length,
          triangles: scene.meshes.reduce(
            (s, m) => s + m.getTotalIndices() / 3,
            0,
          ),
        };
      }
    };
    const observer = scene.onBeforeRenderObservable.add(update);
    listeners.push(() => scene.onBeforeRenderObservable.remove(observer));
    checkAborted(signal);
    listeners.push(installRenderAudit(scene));
    publish();
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}

declare global {
  interface Window {
    __CODEVERSE__?: GameState & {
      playerY: number;
      cameraAlpha: number;
      cameraRadius: number;
      meshes: number;
      skeletons: number;
      animationGroups: number;
      triangles: number;
    };
  }
}
