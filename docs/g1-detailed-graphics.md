# G1 detailed graphics revision

2026-11-27 · Existing React/TypeScript/Babylon playable app · Features frozen.

**A substantial character and scene-detail improvement, not premium/AAA completion.** The screenshots below are actual production WebGPU renders, not generated concept art. The environment still has a noticeable procedural/game-art quality gap.

## A — What changed

- Retained the curved civic landmark and existing playable layout. Added a stone/bronze curtain-wall envelope with projecting slabs, narrow mullions, transoms, spandrels, roof coping, side-window recesses and constructed entrance canopy.
- Replaced opaque blue facade cards with non-metallic, roughness-varied alpha glass, actual furnished office bays about 4.5 m deep, partial blinds and a local plaza reflection capture. Glass has Fresnel/IOR configuration; it is **not** full ray-traced transmission or a complete room-lighting solution.
- Reduced the oversized facade sign; subsequent inspection caught and corrected its intersection with a central pier. Covered the bare white service apron and finished formerly blank side elevations of context blocks.
- Replaced the old authored-shell character with a properly textured/skinned Microsoft Rocketbox adult: recognizable face/hair/hands, jacket and hood, shirt, trousers and trainers, body/head normal maps and source-compatible idle/walk/run motion. Converted to metres and in-place locomotion offline.
- Added different tree silhouettes/rotations/scales, higher branching, a smaller muted flowering tree and fuller shrubs. Retained planting instead of hiding all plants to clear the camera.
- Camera clearance tests inflated foliage-crown ellipsoids and three solid-geometry rays, shortening immediately and releasing smoothly. Added five pure geometry tests. No new camera menu or gameplay system.
- Added offline-filtered HDR material lighting, local glass reflections, contact AO and final edge antialiasing. Paving UV phases/material batches vary; curbs, ramp, drains, markings, street-front masses and street continuation improve the transition beyond the plaza.

No multiplayer, quests, NPC AI, inventory, learning systems or other features were added. Existing movement, collision, grounding, entrance information, pause/reset and renderer policy remain the functional contract.

## B — Assets and rights

| Runtime asset                                                           | Change / source                                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `site-v3.glb`                                                           | Original detailed facade, room bays, plaza and street context; 162 material batches   |
| `hero-urban.glb`                                                        | Microsoft Rocketbox Male Adult 04 + compatible clips, **MIT**, pinned official source |
| `canopy-v3.glb`, `oak-v3.glb`, `blossom-v3.glb`, `underplanting-v3.glb` | Revised original presets using the previously audited MIT EZ-Tree code/leaf input     |
| `daylight-urban.env`                                                    | Offline GGX/RGBD bake of **Greg Zaal / Poly Haven, Pedestrian Overpass, CC0**         |
| Existing generated surface maps, sky and landmark input                 | Retained/reused; no paid/proprietary game extraction                                  |

[Exact sources/licenses](../public/assets/g1/VISUAL-SOURCES.md) · [Pinned character source hashes](evidence/g1-graphics/character-source.json) · [Runtime hashes/bytes](evidence/g1-graphics/runtime-assets.json) · [Rebuild workflow](../scripts/g1/README.md#detailed-graphics-revision-current).

Packaged runtime GLBs/environment/sky total **28,614,776 bytes** before HTTP compression. Authoring downloads/SDKs are not needed to play. Historical binaries are retained as inputs, but are not all loaded by the game.

## C — Actual before / after and correction loop

Every comparison is **1280 × 800**, same named camera positions, actual app. Diagnostic views stage the camera, not a replacement demo or a teleported traversal test.

| View                | Before                                                 | Final                                            |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Default / spawn     | [Previous](evidence/g1-graphics/before/spawn.png)      | [New](evidence/g1-graphics/final/spawn.png)      |
| Exterior            | [Previous](evidence/g1-graphics/before/exterior.png)   | [New](evidence/g1-graphics/final/exterior.png)   |
| Entrance            | [Previous](evidence/g1-graphics/before/entrance.png)   | [New](evidence/g1-graphics/final/entrance.png)   |
| Plaza               | [Previous](evidence/g1-graphics/before/plaza.png)      | [New](evidence/g1-graphics/final/plaza.png)      |
| Road                | [Previous](evidence/g1-graphics/before/road.png)       | [New](evidence/g1-graphics/final/road.png)       |
| Character           | [Previous](evidence/g1-graphics/before/character.png)  | [New](evidence/g1-graphics/final/character.png)  |
| Vegetation          | [Previous](evidence/g1-graphics/before/vegetation.png) | [New](evidence/g1-graphics/final/vegetation.png) |
| Secondary angle     | [Previous](evidence/g1-graphics/before/secondary.png)  | [New](evidence/g1-graphics/final/secondary.png)  |
| Environmental depth | [Previous](evidence/g1-graphics/before/depth.png)      | [New](evidence/g1-graphics/final/depth.png)      |

Sequence: inspected baseline and keyboard perimeter → implemented detailed assets → caught initialization failure (missing AO multi-render-target extension), fixed and rendered → [first five-view pass](evidence/g1-graphics/pass-1/browser.json) → corrected bright repeated rooms, sign scale, antialiasing, thin shrubs and bare context → [second full audit](evidence/g1-graphics/pass-2/browser.json), with selected intermediate images retained → corrected sign/pier intersection, remaining exposed apron and street enclosure → captured and visually inspected all nine final views.

The final [browser/resource audit](evidence/g1-graphics/final/browser.json) reports **WebGPU, ready scene, all 403 audited mesh resources and 80 textures ready, zero page/network errors and no console/GPU validation errors**. These counts are a correctness check, not an art-quality rating.

## D — Honest visual ratings

Subjective ratings against a convincing premium browser-PC urban environment, **not** against the previous blockout and not owner acceptance:

| Category            |   /10 | Main limitation                                                                                           |
| ------------------- | ----: | --------------------------------------------------------------------------------------------------------- |
| Architecture        |     6 | Better section/depth/material hierarchy; repeated bays and simple side wings remain                       |
| Character           |     7 | Major recognizable/model/clothing improvement; older source fidelity and no foot IK                       |
| Environment / depth |     6 | Street enclosure is much better; context still repeats and the horizon exposes sparse areas               |
| Vegetation          |     5 | Better branching/variation; leaf cards and evenly spaced young shrubs remain obvious                      |
| Materials           |     6 | Real room depth and normal maps; glass still reads flat/pale in several frontal views                     |
| Lighting            |     6 | Coherent usable daylight/contact; not rich cinematic indirect illumination                                |
| Camera              |     7 | Closer framing and volume clearance; limited tested trajectories, not an exhaustive obstruction guarantee |
| **Overall**         | **6** | **Improved playable art pass; premium target is not yet met**                                             |

## E — Biggest remaining defects

1. Facade glazing/interiors still look too uniformly pale from the front. Interior light transport, richer reflections and less repetitive room dressing are the next major architecture/material task; simply changing exposure again will not solve them.
2. Background buildings use repeated rectangular windows and similar massing. Wider ground-level views still reveal simplified street edges and sparse outskirts.
3. Shrubs remain too sparse/regular, ground grass visibly tiles and blossom leaves are recolored leaf cards rather than scanned botanical flowers.
4. Character face/shoes/hands now read properly, but this is an older real-time avatar; locomotion has no slope-aware foot placement/IK. Poses do not establish the absence of clipping across every frame.
5. Contact/shadow and ambient-light richness remain below the requested cinematic target. Software rendering here is extremely slow; no physical Windows/gaming-laptop FPS claim is made.

## F — Technical verification

- **`npm run check`: passed** — formatting, lint, TypeScript, **37 unit tests**, production build. Vite still warns about a large renderer chunk; it is not hidden or called a performance pass. [Log](evidence/g1-graphics/check.log).
- **Asset integrity: passed** — all seven loaded GLBs revalidated with **0 errors / 0 warnings**; SHA-256/bytes recorded. Informational glTF messages are retained. [Validation summary](evidence/g1-graphics/validation-summary.json).
- **Renderer-policy browser tests: 8 passed** in the clean-cache suite. The initial development run encountered Vite stale prebundle HTTP 504s; its log is retained, not treated as a graphics/backend pass.
- **Actual keyboard/gameplay test: passed on its completion run** (10.3 min of software execution): walk/run state, collision, entrance information, pause/resume, reset, ramp grounding, road boundary, mouse orbit/zoom and a single canvas, **zero page/network errors**. [Result](evidence/g1-graphics/controller/browser-playable.json) · [Log](evidence/g1-graphics/gameplay-final.log). The earlier full suite was **8 passed / 1 timeout** at the final mouse drag under its 600 s software budget. Only the software-only total time allowance was raised to 900 s; no input, assertion or screenshot check was removed. This is not a clean nine-test single-run claim. [Original timeout](evidence/g1-graphics/browser-suite-600s.log).
- **Full perimeter/approach/road: passed** before and after the revision with actual keyboard and the existing collision controller, no position assignments/teleports. To make the software-only perimeter feasible, up to 24 extra unchanged controller updates run between rendered frames. This is **not normal-speed gait or FPS acceptance**. Separate ordinary-frame walk/run captures confirm active source clips advancing before route acceleration. [Route/poses](evidence/g1-graphics/after/walk.json) · [Walk](evidence/g1-graphics/after/walk.png) · [Run](evidence/g1-graphics/after/run.png).
- **Obstruction case:** player reached the trees by keyboard; diagnostic camera orbit requested an 8 m arm, runtime shortened it to 1.1 m among nearby vegetation/solid props. The captured lens is clear, although framing becomes very close. [Image](evidence/g1-graphics/after/canopy-clearance.png) · [Samples](evidence/g1-graphics/after/canopy-clearance.json). Five pure tests separately cover the foliage-volume intersection math; this one trajectory is not proof of every possible obstruction.
- **Production WebGPU:** nine live rendered viewpoints and complete resource/error audit passed. A real software Vulkan/SwiftShader WebGPU adapter was used, not a simulated successful adapter. **Production WebGL2 also passed** its separate live-render-loop check (ANGLE/SwiftShader, 640 × 480 technical capture): ready resources, zero shader/page/network/HTTP errors and non-black paving pixel check. [Audit](evidence/g1-graphics/backends/production-webgl2.json) · [Rendered image](evidence/g1-graphics/backends/production-webgl2.png). This smaller technical image does not replace the consistent-resolution nine-view visual comparison.

These Linux software-browser results establish execution/rendered output, not physical Windows compatibility, sustained frame rate, memory budget or premium art acceptance.

## G — Play locally / production build

Use Node 22.12+ within 22.x (tested 22.22.3), current Chrome/Edge and hardware acceleration:

```sh
npm ci
npm run dev
# http://localhost:5173
```

For the production playable:

```sh
npm run build
npm run preview -- --port 4173 --strictPort
# http://localhost:4173
```

`dist/` is generated locally, not checked in. On Windows PowerShell use `npm.cmd` if the execution policy blocks `npm.ps1`. No backend, account, API key, Blender or external asset host is required. The Arena production live preview serves this same packaged build.

Default/`?renderer=auto` prefers WebGPU and falls back to WebGL2 only after support/initialization failure. `?renderer=webgpu` and `?renderer=webgl2` force their respective backend and fail visibly instead of silently switching. Controls: WASD/arrows, Shift run, drag/wheel camera, E entrance information, Escape pause/close, R reset.
