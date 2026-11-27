# Graphics validation and feasibility gate

> **Current build update — 2026-11-27:** bounded G1 implementation is approved and the app now contains an early playable scene. See [G1 handoff](g1-playable-handoff.md) for actual software-browser/build evidence and remaining limitations. Historical foundation-only descriptions below do not describe the current scene. Physical Windows/GPU/WebGPU-success/FPS acceptance remains unverified.

> Planning correction, 2026-11-27: the [Master Game Plan](master-game-plan.md) defines the current proposed G1 scope and three independent acceptance categories: visuals, performance on the owner's physical hardware, and production-pipeline repeatability. One fixed player with narrowly scoped movement/animation validation supersedes the historical environment-only/no-character draft quoted below. This is documentation only: no benchmark implementation, asset acquisition or modeling is authorized.

## What Milestone 0 can establish

Engine initialization, backend semantics, neutral clear surface, sizing, lifecycle cleanup, errors, and an executable quality pipeline. A successful empty renderer is **not** evidence that a premium open-world game is feasible at the required quality or scale.

The [official concept image](reference/README.md) remains the benchmark. Current screenshots show only the shell, not progress toward a rendered city.

## Technical risks and responses

| Risk                                                                          | Validation/response                                                                                                    |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Insufficient asset quality or unclear licensing                               | Review asset sources, scale, authored detail, licenses, and redistribution rights before selection                     |
| Texture/geometry memory exceeds hardware budgets                              | Measure actual residency where possible; establish texture tiers, mipmaps, mesh LODs, and streaming budgets            |
| Excessive draw calls, shadows, reflections, transparency, or foliage overdraw | Profile a representative combination; evaluate instancing, occlusion, shadow budgets, and rendering techniques         |
| Asset decompression, loading, shader compilation, and main-thread stalls      | Separate cold/warm runs; record transfer/decode/upload/compilation time and frame-time spikes                          |
| WebGPU/WebGL2 feature and driver differences                                  | Capture both paths explicitly; no assumed visual or performance parity                                                 |
| Large-city streaming and long-session precision/memory issues                 | Later scope must validate partitioning and residency; a small scene cannot prove open-world scale                      |
| React or future UI interferes with frame time                                 | Keep frame updates imperative; profile main-thread/UI work independently                                               |
| Device/context loss and driver resets                                         | Exercise software context loss now, physical device loss later; fail visibly rather than claiming recovery             |
| Reference exceeds the selected technique/hardware envelope                    | Identify measured bottlenecks, propose content/rendering/architecture changes, obtain approval before lowering quality |
| Restricted asset/network access in development                                | Stage licensed assets through approved accessible sources/uploads; self-host reviewed runtime dependencies             |

Babylon is a candidate chosen for evaluation, not a guarantee. WebGPU alone does not supply high-quality models, lighting, reflections, or streaming. If the target cannot be met, propose a better rendering/content approach or a different delivery architecture with measured tradeoffs before changing the target.

## Graphics Feasibility Benchmark — planning gate after A1 asset readiness

**Not implemented in Milestone 0. A detailed execution plan and separate owner approval are required first.** The master roadmap remains unchanged: P1 → A1 → G1 → G2 and subsequent milestones. General gameplay remains blocked until G1's three categories are accepted; the only proposed benchmark exception is narrowly scoped fixed-player movement/camera/animation validation.

Current proposed slice: concept-aligned landmark/plaza, a short detailed pedestrian/road segment, limited vegetation/props, daylight lighting and one fixed player/outfit. Exact assets, techniques, viewpoints, budgets and physical target hardware must be approved before execution. No full character customization, population, traffic, driving, multiplayer, XP, economy or learning systems are included.

**Historical draft, superseded for scope only (retained for traceability):**

> Propose a small representative environment slice using approved, licensed production-quality assets—not a city, primitive proxy scene, or gameplay prototype. Its exact assets, rendering techniques, camera viewpoints, budgets, and target hardware must be approved first. No character, multiplayer, driving, XP, economy, or learning systems are needed for the initial environment benchmark.

### Three independent acceptance categories

Use [Master Game Plan, Section 8](master-game-plan.md#8-graphics-feasibility-benchmark-contract) for the full contract:

1. **Visual acceptance:** actual rendered landmark identity/silhouette, geometry/structural detail, materials/textures, lighting/shadows, character, animation/movement, composition/camera and original/reusable asset consistency. Running successfully or achieving high FPS does not pass this category.
2. **Performance acceptance:** actual owner-hardware/software environment, backend, resolution/render scale, frame-time distribution, average FPS and relevant percentiles, measurable CPU/GPU bottlenecks, measured memory/resource estimates, loading/shader preparation, stutters and sustained behavior. Unavailable metrics and untested compatibility remain explicit; no invented results.
3. **Production-pipeline acceptance:** practical source modeling/editability, geometry, UVs, materials, glTF/GLB export, Babylon loading, collision/LOD preparation, optimization, missing-dependency checks and a repeatable documented preparation/export/load cycle. Rendering one scene is insufficient.

**All three must pass independently.** Missing evidence means not evaluated/blocked, not a pass. For each failure, retain evidence, bottlenecks, corrective actions and required retests; check fixes for regressions in the other categories. No silent art-direction downgrade and no advancement through the gate on an FPS-only or visual-only pass. The requirements define future evaluation only and authorize none of its execution.

A1 must apply the [explicit asset-quality rejection gate](master-game-plan.md#explicit-asset-quality-rejection-gate). A free asset or generator base is not automatically suitable or production-ready.

### Hardware and visual test matrix

- Primary: named Windows gaming-capable PC, current stable Chromium browser, physical GPU, 1920×1080.
- Record CPU, GPU/VRAM, RAM, OS, GPU driver, browser version, power mode, backend, resolution, render scale, and settings.
- Explicit WebGPU and explicit WebGL2 runs on the same hardware. Unsupported combinations must be documented, not silently substituted.
- Define lower/mid/high hardware tiers after initial measurements. Proposed starting target: 1080p/60 FPS on the agreed reference PC; **not yet accepted as a hardware guarantee**.
- Linux/headless/SwiftShader results cover correctness only; no physical-GPU performance inference.

### Measurement procedure to approve

1. Identify comparable views/material/lighting details from the official concept and state which aspects the slice does not evaluate.
2. Capture fixed viewpoints and a repeatable camera path. Separate cold-start and warmed runs.
3. Proposed run protocol: 30-second warm-up followed by three 60-second captures per configuration; retain raw frame-time traces and summary statistics.
4. Measure frame-time distribution (including median and p95/p99), average/sustained FPS with relevant percentile definitions, draw calls, triangles, transfer size, load-to-first-frame and shader stutter. Record CPU/GPU timings/bottlenecks and memory indicators only where reliably available; label resource estimates and unavailable metrics. Browser APIs do not universally expose exact VRAM usage.
5. Compare matched screenshots from both backends against the concept at full resolution. Inspect shadows, material response, reflections, antialiasing, vegetation, scale, and consistency from multiple views.
6. Perform a sustained stability run (duration to agree), test resizing/context loss, and distinguish cold compilation from steady-state rendering.
7. Retain documented source versions/dependencies and evidence of source preparation/editability, geometry/UV/material checks, collision/LOD preparation, optimization and repeatable glTF/GLB export/Babylon loading for the representative assets.
8. Submit separate visual, performance and production-pipeline results and actual evidence for owner approval. Any failed or untested category blocks the overall pass; report evidence, bottlenecks and corrective actions. No silent downgrade or advancement to dependent milestones.

A single beauty screenshot or an empty-scene FPS figure cannot satisfy this gate.

## Foundation test layers

- **Unit policy tests:** deterministic backend ordering, forced-mode behavior, aggregate failure reasons, cancellation, late-result disposal. Test doubles do not prove a real GPU works.
- **Lifecycle tests:** mocked engines/DOM verify render-loop/observer/scene/engine/canvas teardown, failed initialization cleanup, remount, and loss notification.
- **Scene-contract test:** Babylon NullEngine confirms zero meshes/lights/materials/textures and one required camera. This does not render on a GPU.
- **Browser tests:** real WebGL2 initialization, one canvas under React StrictMode, resize/reload, automatic selection, reported fallback, explicit-backend errors, loading, and actual `WEBGL_lose_context` loss. Capability overrides are used only to exercise failure/pending paths.
- **Manual physical-hardware checks:** successful WebGPU initialization, backend visual parity, high-DPI/multi-monitor behavior, actual device loss, Windows drivers, and performance remain separate outstanding checks.

Screenshots document the shell. They are not golden-image regression baselines or a visual-quality pass. Future graphics milestones must introduce approved, stable visual comparisons.
