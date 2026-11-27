# CodeVerse G1 — early playable handoff

> **Subsequent visual overhaul:** [current implementation, rendered evidence and limitations](g1-visual-overhaul.md). The implementation description and pass counts below describe the earlier handoff. They are retained as history, not current visual acceptance or a current asset manifest.

> **Subsequent rendering correction:** owner testing exposed a mostly-black WebGPU scene missed by the initial software-WebGL2 smoke. The failure is now reproduced and corrected; [see before/after and actual browser evidence](g1-rendering-fix.md). Earlier pass counts below are historical, not proof that the old WebGPU output was correct. Feature expansion is paused.

**2026-11-27 · implementation approved · actual app, not the A1 viewer.** This is an early runnable iteration for owner feedback, not a premium-art/performance acceptance claim. Prior evidence and decisions remain in the A1 reports; no Blender retry or additional approval gate was introduced.

## What is implemented

- Original completed curved landmark/site construction integrated into the normal React/Babylon app, with additional original entrance identity, blue inlays, restrained generated paving microtexture, directional daylight, shadows and procedural sky reflection.
- Existing benches, planters, lights, a short pedestrian connection/ramp and bounded road segment; three static tree/shrub placements and an early original pink petal treatment.
- Actual clothed skinned human from approved CC0 core graphics, not a capsule/robot. Original garment shells/accessories and Idle/Walk/Run joint clips. Normalized original skin weights including more-than-four influences are retained. This route reads core data; it is **not a successful Blender/MPFB export or third-party motion retarget**.
- Camera-relative WASD/arrows, Shift run, drag orbit, wheel zoom, limited camera-arm collision shortening, rotation smoothing, ground/ramp height and bounded axis-stepped collision. R resets player/camera. No jumping, physics simulation or interiors promised.
- E proximity interaction at the real blue entrance marker opens dismissible **location information**. It grants no quest/reward and calls no nonexistent backend. Escape closes information or toggles pause; losing focus pauses movement.
- Branded loading/visible errors, actual backend/fallback diagnostics, pause/resume/reset UI. WebGPU-first automatic selection and explicit no-silent-fallback modes retained. Async cancellation/unmount cleans scene/game listeners/engine/canvas; asset failures do not switch backend.

## Run on Windows

No laptop installation or remote access has been performed. With Node 22.22.3/npm 10.9.8 already available, open PowerShell in this checkout:

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open `http://localhost:4173` in current Chrome/Edge with hardware acceleration enabled. Keep the terminal open. Ctrl+C stops it. No backend/database/Docker/account/environment file/Python/Blender/asset-authoring setup is needed. `npm.cmd ci` fetches normal project dependencies; runtime GLBs/textures/notices are packaged in the repository.

The Arena live preview uses HTTPS; its browser-facing asset paths are same-origin. Do not replace them with sandbox localhost URLs. Local preview is a test server, not a production hosting deployment.

## Owner smoke check (about five minutes)

1. Open the default URL. Confirm Central Plaza, the clothed player and backend name appear; note any actual fallback reason.
2. Move with WASD/arrows. Hold Shift and compare walk/run. Drag to look around, then scroll to zoom. The camera-relative direction changes with your view.
3. Approach the entrance along the blue inlays. E becomes available nearby; open/read/close the information panel using E, Escape and its button. It should not claim to start a quest.
4. Push into the building and nearby benches/planters; movement should stop/slide rather than cross. This is a simplified footprint controller, not detailed per-triangle character physics.
5. Return with R. Walk backwards down the short connection, across the ramp to the bounded road. Grounding lowers by 0.15m. This is not a drivable/full city road network.
6. Escape pauses; Continue resumes. Switch browser focus and return: movement should be paused. Reset restores spawn and camera.
7. Resize/reload. Try `/?renderer=webgl2`; try `/?renderer=webgpu` only if supported. Forced WebGPU failure must stay visible, not silently become WebGL2.
8. Record browser/version, selected backend, viewport size, visible defects, perceived stutter and any error text. Hardware specs can be supplied when convenient, not as a prerequisite to implementation.

Do not run asset generators to play. Optional reproducible authoring instructions: [scripts/g1/README.md](../scripts/g1/README.md). Runtime source/license notices: [public/assets/README.md](../public/assets/README.md).

## Verification and evidence

Unit tests cover renderer policy/lifecycle, new async world failure/cancellation, collision/sliding/bounds, interaction distance and ramp heights. TypeScript/lint/build and glTF validation are also checked. Current exact browser results and screenshots are recorded in `docs/evidence/g1/verification.json` and the accompanying captures.

**Verified:** `npm run check` passed (format, lint, typecheck, 30 unit tests, production build). The full browser suite passed 9/9; the strengthened traversal/camera test passed again after the camera/context update. Final production-build smoke passed with one canvas, WebGL2, no page/network/HTTP errors and no DEV telemetry. Hero validation: zero errors/warnings; regeneration of the current hero/surface binaries was byte-identical. The engine chunk remains about 2.64MB raw / 667KB gzip and Vite still warns about chunk size.

- `production-playable.png` / `browser-production.json`: latest final-build capture and clean smoke result, after fixing a context-ground shadow-frustum artifact. This is the most current visual evidence; the other gameplay captures precede that final shadow-only correction.
- `hero-validation.json`: current GLB validator result.
- `runtime-assets.json`: packaged byte sizes and SHA-256.
- `browser-playable.json`: actual controller snapshots and browser errors/failed requests.
- `playable-spawn.png`, `playable-information.png`, `playable-orbit.png`: actual app captures, not generated concept art.
- `browser-initial.json` / `first-playable.png`: retained intermediate diagnostic. Its stale Vite optimization request failures are **not** a clean networking pass.

Browser validation here uses explicit Chromium SwiftShader software WebGL2. It is not HP Victus, physical GPU, successful WebGPU, Windows, sustained memory/FPS or premium visual proof. No laptop benchmark number has been invented.

## Known limitations — not hidden scope reductions

- **Visual quality is still early.** Plain architecture/material breakup, simple sky/no surrounding city, sparse canopy/planting, basic blossom clusters and hero silhouette/hair/clothing are below the premium concept target. The integrated scene must improve; this is not final visual acceptance.
- Hero tailoring/shoulder/elbow deformation and gait need specialist refinement. Original cycles are functional rather than mocap quality; no foot IK, grounded-foot acceptance, animation blending or macro/customization pipeline is claimed. Input movement uses collision bounds, not a capsule visual substitute.
- Fixed simple daylight/shadow settings, uncompressed runtime GLBs, no KTX2 texture pipeline, no distance LOD switching, no measured adaptive quality tiers. The production engine chunk remains large and Vite warns; selective Babylon imports reduce it but do not solve all download/compile cost.
- Collision follows simplified authored footprints/site bounds, with no stairs/interior traversal or rigid-body physics. Camera shortening is a simple ray arm, not a full swept-volume solution. Outer bounds are not yet all visibly dressed; some large boundary/oblique camera views expose the small isolated site.
- Desktop keyboard/mouse only; touch/gamepad and full accessibility/focus-trapping polish are not implemented. Modal movement is stopped; camera orbit is not a full simulation pause.
- No traffic/driving, NPC population, full city, multiplayer, interiors, customizer, progression, economy, academy activities or server exists. Those exclusions remain unchanged.

The next work is targeted visual/deformation/camera and owner-hardware iteration **within G1**, not a new source-research milestone. Visual quality, physical performance and repeatable pipeline proof remain separate acceptance categories.
