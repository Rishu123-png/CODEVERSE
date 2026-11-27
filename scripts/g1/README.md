# G1 optional authoring — not needed to play

Runtime binaries live in `public/assets/g1/` and run from a normal `npm ci` + app build. No Blender, Python, source archive or cached authoring SDK is required by the app. Run commands below from repository root only on an authorized development machine. No global installs, purchases or system-library changes are needed.

## Hero and surface regeneration

Requires Python 3 and Node 22/npm. The setup helper downloads the **official MPFB v2.0.18 source archive**, verifies SHA-256 before extraction, and copies the already audited/pinned SDK manifests into ignored cache. It does not execute MPFB or Blender. If the source is cached it verifies/reuses it. Archive source/hash are also recorded in `scripts/a1/README.md`.

```sh
python scripts/g1/restore-authoring-inputs.py
npm ci --prefix .cache/a1/tools
python scripts/g1/prepare-character.py
node scripts/g1/build-character.mjs
node scripts/g1/build-surfaces.mjs
```

On Windows use `py -3` instead of `python` if appropriate and `npm.cmd` instead of `npm`. All intermediate data/tools stay under ignored `.cache/`. The SDK versions come from `scripts/a1/toolchain-package{,-lock}.json`; no unpinned CLI is needed. MPFB code GPL and its core graphics CC0 distinction is preserved in runtime notices. Only core data is read.

Hero generator writes `public/assets/g1/hero.glb`, hash/provenance, and validator output in `docs/evidence/g1/hero-validation.json`. It preserves normalized original weights, including vertices with more than four influences, and creates original procedural Idle/Walk/Run clips. Dedup/weld/prune reduce repeated face vertices without removing the original influences. This is **not proof of Blender rest axes/bone roll, professional tailoring, anatomical final quality, retargeting, foot IK or accepted gait**. Rerunning intentionally replaces these outputs; review evidence changes.

The surface generator writes original color/normal maps. Both generators use the isolated SDK location restored above. Landmark/vegetation construction and the original audit/history remain under `scripts/a1/` and existing evidence; do not redo completed studies just to run the application. The packaged copies are the runtime source of truth; their SHA-256/byte manifest is `docs/evidence/g1/runtime-assets.json`.

## Actual app checks

Use `npm run check` and `npm run test:e2e` from repository root. Browser tests launch the app, not an isolated asset study. `tests/playable.spec.ts` drives real keyboard/mouse events against the scene and writes current G1 evidence. It uses DEV-only read-only telemetry for position assertions; it never teleports the hero to pass traversal checks.

For a separate production smoke, build and serve the app on port 4173, then run `node scripts/g1/check-production.mjs`. It checks actual build loading, backend, one canvas, absent DEV telemetry and page/network/HTTP errors, and captures `production-playable.png`. Browser path/software environment variables follow the main suite.

`check-playable.mjs` is a sandbox-specific supplementary screenshot helper using cached Chromium/libs. The portable, maintained browser test entry is `npm run test:e2e`. Software SwiftShader results are not Windows, physical GPU, WebGPU-success or FPS acceptance.

## Black-scene rendering regression investigation

See [actual before/after and root cause](../../docs/g1-rendering-fix.md). With development on 5173 and a freshly built production preview on 4173:

```bash
RENDER_MODES=production-webgpu,production-auto,production-webgl2,development-webgpu,development-webgl2 RENDER_ASSERT=1 node scripts/g1/diagnose-rendering.mjs
```

The helper deliberately requests a software SwiftShader browser for reproducibility, not laptop/FPS measurement. In this Linux sandbox it also requires the existing cached Chromium path/libraries and `RENDER_VULKAN=1`, with `VK_ICD_FILENAMES` pointing at the cached SwiftShader ICD. These flags are **test-launch settings**, not application settings or laptop installation instructions. It must obtain a real successful WebGPU adapter (software is clearly labeled), not count a fallback as WebGPU success. `RENDER_VIEWS=1` adds production diagnostic overview, character/vegetation and reload/resize captures. The default output directory is `docs/evidence/g1-rendering/after`; set `RENDER_EVIDENCE` to preserve another run.

The test uses `pngjs` (development-only MIT dependency) to inspect actual screenshot pixels in a UI-free paving region. Black output now fails even if the DOM says ready. Console GPU validation warnings, texture/mesh readiness, missing normals, page/network/HTTP and shader errors are also checked. A pixel threshold supplements **visual screenshot review**, not a replacement for it. The optional diagnostic URL hook is absent on normal play URLs.

`probe-webgpu.mjs` reproduces the browser-only isolation switches used during diagnosis. It does not modify game assets or shipped material settings; its old failure captures are retained under `probes/`.

## Visual revision authoring and evidence

The revised app uses `landmark-v2.glb`, `site-v2.glb`, the new canopy/blossom/underplanting GLBs and the revised `hero.glb`. Do not regenerate the old G1 assets over them merely to run the game. The earlier manifest is historical. See `public/assets/g1/VISUAL-SOURCES.md` and `docs/evidence/g1-visual/runtime-assets.json` for current provenance/hashes.

With the already inspected A1 toolchain/source cache restored on an authorized authoring machine:

```sh
node scripts/g1/build-visual-surfaces.mjs
node scripts/g1/build-character.mjs
node scripts/g1/build-environment.mjs
node scripts/g1/build-vegetation.mjs
npm run build
```

`build-character.mjs` requires the prepared `.cache/g1/character-source.json`. The vegetation recipe requires the pinned EZ-Tree source/npm leaf bytes and `.cache/a1-final/tree-node.mjs` from the retained A1 authoring process. These are optional authoring prerequisites, **not game runtime dependencies**. No Blender retry is involved. Normal install/build/play works from the packaged outputs.

`capture-visual.mjs` captures the real production app at 1280 × 800, not generated illustrations. It writes an early resource audit, spawn and named views plus a final console/network report. Set `VISUAL_EVIDENCE`, optionally `VISUAL_URL` and comma-separated `VISUAL_VIEWS` (`character,entrance,overview,vegetation,road,plaza`). Its software Vulkan launch needs the same cached browser environment as the renderer investigation. Run GPU/browser checks sequentially in this software environment; screenshots are not FPS measurements. Interrupted directories without `browser.json` are incomplete runs, not clean passes.

For constrained software-browser regression runs, `diagnose-rendering.mjs` accepts `RENDER_WIDTH` / `RENDER_HEIGHT` (defaults 960 / 600). `RENDER_RESIZE=1` adds production WebGPU reload/resize without the redundant older diagnostic camera tour. Reduced capture resolution is explicitly recorded by each image/audit and is not a performance or visual-fidelity benchmark.

The visual-revision backend follow-up uses one screenshot per ordinary path after actual scene readiness, with pixel checks performed on that captured frame. Live readbacks repeatedly timed out in software WebGL2, even after removal of the duplicate; those incomplete runs are retained, not called passes. The separate production WebGPU reload/resize path remains available. No pixel/resource/error assertion was weakened to remove the duplicate readback.

`RENDER_STATIC_CAPTURE=1` is a separately labeled diagnostic: after scene readiness it stops scheduling new Babylon frames while reading the already-rendered canvas. It changes no material/asset/resolution/shadow setting. This isolates readback from continuing workload; it **does not establish continuous-rendering correctness or performance**. Use the real-input browser suite and ordinary live captures as separate evidence.

## Detailed graphics revision (current)

The normal app now loads `site-v3`, `hero-urban`, four v3 botanical variants and the offline-baked `daylight-urban.env`. **Do not run an old v2 recipe over them.** Runtime installation still needs only `npm ci`, never the source toolchain. Source/license details: `public/assets/g1/VISUAL-SOURCES.md`; exact current hashes: `docs/evidence/g1-graphics/runtime-assets.json`.

Optional hero/HDR reconstruction from pinned, hash-checked public sources (GitHub CLI must be available):

```sh
python scripts/g1/restore-urban-inputs.py
npm ci --prefix .cache/a1/tools
npm ci --prefix .cache/g2/tools
node scripts/g1/convert-urban-fbx.cjs Male_Adult_04.fbx m_idle_breathe_01.max.fbx m_walk_neutral_01.max.fbx m_run_neutral_01.max.fbx
node scripts/g1/build-urban-hero.mjs
node scripts/g1/build-daylight.mjs
node scripts/g1/build-detailed-environment.mjs
```

The detailed environment reads retained packaged original textures and `landmark.glb`. Its validation output is `docs/evidence/g1-graphics/environment-validation.json`. Hero output includes validator errors/warnings. Tree regeneration is `node scripts/g1/build-natural-vegetation.mjs`, with the same pinned EZ-Tree inputs and Node-adapted wrapper described in the prior authoring section; those optional upstream files are not secretly required by `npm run build`. Avoid installing Blender merely to run/play this build.

`capture-graphics.mjs` captures the actual app at **1280 × 800**. Named views are `spawn` (always first), `exterior`, `entrance`, `plaza`, `road`, `character`, `vegetation`, `secondary`, `depth`; `overview` is an optional extra. Set `VISUAL_EVIDENCE` and `VISUAL_VIEWS` to preserve separate passes. It checks final mesh/texture readiness plus console/page/network failures. `before` is the inspected pre-change runtime; `pass-1` caught bright interior repetition/oversized sign/bare apron and sparse low planting; `pass-2` is the second audit; `final` is the fully retained corrected nine-view run. An initial loading failure was retained, not relabeled a success. These software-Vulkan captures establish rendered output, not physical PC FPS.

Intermediate pass 2 retained exterior/entrance/road comparisons plus its full audit; other intermediate images were moved to ignored scratch storage to keep the saved patch small. The complete nine-view baseline and final are retained.

`node scripts/g1/validate-graphics.mjs` revalidates the actual seven packaged GLBs, including SHA-256 and warning counts. `node scripts/g1/check-perimeter.mjs` is the supplementary software-WebGPU route/motion/obstruction check: its route uses extra unchanged controller updates between draws, explicitly **not** real-time gait or FPS acceptance. Ordinary walk/run snapshots precede that acceleration. The maintained keyboard/camera test keeps normal updates and accepts `E2E_EVIDENCE` for a new output directory; software-only total time budget is longer without dropping any functional assertion.

## Connected district revision (latest)

Do not run the older site recipe over the current district. The latest optional authoring recipe is `node scripts/g2/build-district.mjs`, followed by copying `.cache/g3/site-district.glb` to `public/assets/g1/site-v3.glb`. It shares `src/game/districtLayout.ts` with controller collision. Runtime needs no authoring cache: `npm ci && npm run dev` is unchanged.

- `scripts/g2/validate-district.mjs`: validates/hashes current assets into `docs/evidence/g2` without overwriting historical evidence.
- `scripts/g2/measure-area.mjs`: flood-fill collision-space estimate; accepts a movement module and optional JSON output. The small historical movement snapshot is in `scripts/g2/baselines`.
- `scripts/g1/record-camera.mjs`: native mouse/key/wheel input and before/after-render telemetry; set `MOTION_BACKEND`, `MOTION_PORT`, `MOTION_EVIDENCE`. Latest tool pauses scheduling only for framebuffer readback, then resumes the original render loops. It is **not uninterrupted video**, and frame sequences must be labeled retimed.
- `scripts/g2/capture-district.mjs`: current real rendered district angles; same readback-only scheduling pause. Interrupted folders without `browser.json` are not completed passes.
- `scripts/g2/check-district.mjs`: actual keyboard route with up to 24 unchanged controller updates per drawn frame, no teleporting. This accelerates functional coverage, not gait or performance acceptance.
- `scripts/g2/encode-evidence.py`: labels/encodes already-captured frames at an explicitly retimed 2 fps; optional Pillow/imageio-ffmpeg authoring dependencies. No imagery is synthesized.

All software-browser work should run sequentially. No Windows hardware performance has been verified. Current report and limitations: `docs/g2-connected-district.md`.

To stay within saved-workspace size limits, superseded intermediate PNGs from visual passes 1–3 and detailed-graphics pass 2 are not retained in the saved patch. Their JSON audits remain. Canonical historical before/final image sets and the latest district evidence are retained; no such intermediate directory is presented as a complete gallery.
