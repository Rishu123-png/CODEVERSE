# Visual revision evidence index

These are real app screenshots/audits, not concept renders or AI-generated images. See [review report](../../g1-visual-overhaul.md).

## Current

- `pass-5/`: completed production Vulkan/SwiftShader WebGPU seven-view capture. All seven images were visually inspected. `browser.json` contains console/network/resource audit; it does not establish premium quality or physical-GPU performance.
- `runtime-assets.json`: current packaged runtime GLB/sky SHA-256 and byte inventory, plus standalone original authoring maps. Replaces the earlier G1 manifest only for current-binary verification, not historical record.
- `environment-validation.json`, `vegetation-build.json`, and `../g1/hero-validation.json`: current generator/validator outputs. `hero-before-validation.json` preserves the pre-visual character validation.
- `backend/`: completed production WebGPU/Auto pixel/resource audits and WebGPU reload/resize; the first matrix then timed out on a WebGL2 screenshot (`partial-run.log`). `backend-small/` retains a second screenshot-readback timeout at reduced resolution. `backend-verified/` retains a third timeout, including after removing the duplicate readback. Its name is not a pass claim. `backend-static/` retains a further timeout with new-frame scheduling paused; it did not fix the readback stall and is **not a pass**. Dynamic WebGL2 controller behavior is tested separately in the 9-test suite. `backend-webgl/` contains successful production/development WebGL2 live captures using explicit ANGLE without the Vulkan WebGPU launch configuration. `backend-webgpu-dev/` is the separate development Vulkan-WebGPU follow-up. Only completed JSON/assertions support a pass.
- `glb-validation.json`: all six active GLBs checked together, zero validator errors/warnings.
- `controller/`: real keyboard/mouse/controller evidence from `tests/playable.spec.ts` (only a completed run with `browser-playable.json` supports a pass claim).
- `verification.json`: final exact check outcomes, environment, limitations and links.

## Retained iterations

- `before-spawn.png`, `before-overview.png`: actual previous construction-study presentation.
- `pass-1/`: first new architecture/site/material capture and browser audit.
- `pass-2/`: incomplete, five captured views and screenshot-timeout record. Spawn inspection exposed sky smearing. **No clean-run claim.**
- `pass-3/`: complete optimized geometry/foliage/sky iteration; inspection exposed character poke-through, disconnected road and poorly placed foliage camera.
- `pass-4/`: incomplete context/road/garment iteration, with inspected shadow-acne regression. See `interrupted.txt`. **No clean-run claim.**

The earlier `../g1/` and `../g1-rendering/` directories remain historical evidence, not a substitute for retesting the revised scene. In particular, the accepted black-scene fix and its before/after record are preserved.

Linux software SwiftShader/Vulkan is not the owner's Windows laptop, a physical GPU, a sustained FPS/memory measurement, professional art acceptance or a reference-match score.
