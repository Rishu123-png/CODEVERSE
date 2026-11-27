# Connected district and persistent camera revision

2026-11-27 · Implemented and tested revision of the existing playable project. Art quality remains work in progress, not AAA/premium completion.

## 1. Camera investigation and cause

The previous implementation had multiple owners of the orbit state: Babylon's attached ArcRotate input/movement controller, game `onBeforeRender` target/collision correction, and an `onAfterRender` radius restore. The next frame therefore did not start with the same arm state that was drawn. Native-input baseline telemetry measured a **1.035726 m maximum post-render radius-versus-position disagreement during zoom**. This is a concrete state-lifecycle defect, not a subjective smoothing guess.

The native camera advanced on engine frame time, while player, follow and collision used a clock capped at 50 ms. Those disagree especially during slow/irregular frames. Camera target following, collision release and native inertia consequently had different timing/state ownership. [Saved pre-change source excerpts](evidence/g2/camera-before-source.txt). The baseline establishes the radius mismatch; it does **not** prove that this alone explains every reported rotational shake.

The player is kinematic, not a separately interpolated physics body. No duplicate game render loop was found in the inspected lifecycle. The scene remains near the origin; large-world precision is not the likely issue. Static reflections and non-temporal SSAO are not evidence of a temporal-history bug. Moving shadow projection could contribute visible shimmer, so its player-centred footprint is now snapped in light space. AO/foliage/shadow aliasing can still look like image shimmer and must not be confused with camera-state movement.

## 2. Camera fix

`src/game/stableCamera.ts` is the sole owner of requested orbit, follow target and persistent rendered arm. Native ArcRotate controls are detached; the camera supplies projection/view only. Native pointer/wheel events feed the rig. All movement/follow/rotation/clearance integration uses the same capped game clock. Exact critically damped integration replaces competing inertia and correction paths.

Requested zoom is separate from actual collision distance. Solid ray-fan and inflated canopy clearance remain enabled. Safe retraction is immediate, with 180 ms contact-release hysteresis and damped expansion. There is no after-render restore. Drag sensitivity remains 0.004 radians/pixel; angular response is deliberately quick, not disguised by unusably slow rotation. Reset clears velocities and pending goals. Orbit FOV/framing is wider (68°, 7.4 m default arm).

## 3. Camera evidence

- [Baseline native-input telemetry](evidence/g2/before-camera/motion.json) and [retimed baseline MP4](evidence/g2/before-camera.mp4).
- WebGPU follow-up: **107 live rendered frames**, zero page errors; maximum post-render arm/position disagreement **2.67 × 10⁻¹⁵ m** (floating-point noise), versus 1.035726 m before. [Telemetry](evidence/g2/after-camera-webgpu/motion.json) · [Retimed camera sequence](evidence/g2/after-camera-webgpu.mp4). WebGL2 follow-up: **140 live rendered frames**, zero page errors and the same **2.67 × 10⁻¹⁵ m** maximum disagreement. [Telemetry](evidence/g2/after-camera-webgl2/motion.json) · [Retimed WebGL2 sequence](evidence/g2/after-camera-webgl2.mp4). [Machine-readable comparison](evidence/g2/camera-comparison.json). This is a camera-state consistency result, **not** a perceptual jitter score or proof that every source of rotational image shimmer is gone. The camera sequences precede the last hall/ground/idle/layout refinements; WebGPU also precedes the analytic trunk-volume addition. The core orbit implementation is unchanged. Final stills and the gameplay retry use the current build.
- Recording uses actual native drag, key and wheel input and the live game loop. Latest harness pauses scheduling only for framebuffer readback, then resumes the original loop. It is not uninterrupted real-time video. Each camera MP4 contains 28 captured images; the 107/140 frame counts refer to telemetry draws, not encoded video frames or FPS. All encoded sequences are visibly labeled **retimed**, not FPS or physical-laptop proof.

## 4. Expansion amount

A four-neighbour flood fill from spawn on a 0.5 m grid estimates reachable collision-free controller space:

|                         |      Before |      Current |
| ----------------------- | ----------: | -----------: |
| Reachable area estimate | 1,186.25 m² | 10,285.25 m² |
| Bounding span           |   46 × 59 m |  114 × 134 m |

That is **+9,099.00 m², approximately 8.67×** the former reachable estimate, not an 8.67× claim about art fidelity. The measurement excludes blocked parcels, beds and furniture, but is a grid estimate rather than surveyed ground area. Both entire sampled free-space sets are connected to spawn. [Before measurement](evidence/g2/reachable-before.json) · [Current measurement](evidence/g2/reachable-after.json). The historical controller snapshot is retained for reproducibility.

## 5. New connected areas

- Side streets at x ±29 join three east–west streets, with actual road surfaces, sidewalks, four-way junctions, crosswalks, drainage/curbs and pedestrian links.
- West Exchange: brick arcade, deep portals and stone colonnade.
- Copper Arts Hall: lower copper-finned hall and northlight sawtooth roof.
- Garden Residences: stepped residential massing, balconies and planted setbacks.
- South Conservatory: vaulted glazed roof, ribs and a lighter civic silhouette.
- District Library: recessed masonry/ceramic civic frontage.
- North Lantern: stepped slender glazed/ceramic tower.
- Market Studios: pitched zinc roofs, gable windows and shop awnings.
- Clay Court: brick bays, rounded corner turret and copper cornice.
- Pocket gardens, benches, street trees and designed boundary/roadwork transitions. More distant skyline buildings are scenery, not secretly playable rooms or an endless city.

The original curved landmark and Rocketbox character are retained. This is a detailed small district, not a full open-world city simulation. New buildings have exterior collision; this task does not add enterable interiors or unrelated gameplay.

## 6. Graphics changes and inspection loop

The district is authored as new non-overlapping road/paving cells rather than enlarging empty ground bounds. Architectural silhouettes, roof types, masonry, fins, recessed windows, entries, awnings, gardens and street-level objects now vary by parcel. Existing curved facade construction, glass/interior depth and furnished bays are retained. Interior ambient visibility, denser approach beds, wider initial framing and snapped local sun projection were adjusted.

First expanded-district render inspection caught paving-edge alignment, excessively tall sawtooth slopes, blank distant side walls and sky clear-colour columns introduced when tightening the far clip while retaining the old oversized skybox. The following build adjusted pavement edges, roof rise, side-window grids and skybox size. Subsequent rendered inspections found roof seam strips still using the former roof height, mineral paving joints exposing green ground, and a first-frame bind-pose blend. These were corrected in subsequent builds; initial idle is sampled before regular transitions. The hall’s long side elevation was also still exposing its dark interior block, so it now receives recessed exhibition glazing, ceramic piers, transoms, copper fins and sill/coping depth instead of a bare black face. A further layout review moved four trees out of road lanes into garden/verge pockets and shared all accent-tree trunk positions with collision. Analytic trunk volumes now complement leaf-crown camera clearance. Ground surfaces remain textured PBR; shadow/AO/camera collision have not been disabled as a workaround. Character source, materials, scale and compatible idle/walk/run assets are preserved, not falsely presented as a new character acquisition in this revision.

Current site GLB: **15,521,448 bytes, 316 material/geometry batches**, versus 14,741,572 bytes and 162 batches previously. The extra batches are a draw-call cost; software capture is slow. No hardware FPS result is claimed. [Current runtime hashes and validation](evidence/g2/runtime-assets.json) · [Rights/provenance](../public/assets/g1/VISUAL-SOURCES.md).

## 7. Before/after screenshots

Historical comparison: [previous spawn](evidence/g1-graphics/final/spawn.png), [previous main building](evidence/g1-graphics/final/exterior.png), [previous road](evidence/g1-graphics/final/road.png). First expanded-district inspection is retained in `evidence/g2/pass-1`; interrupted capture attempts are not clean passes.

The latest ten requested angles were captured and inspected after repeated correction passes in `evidence/g2/final`: spawn, main building, character, plaza, road, expanded street, intersection, varied buildings, vegetation and distant depth. The complete second pass was inspected; its clean browser audit and selected defect views are retained in `evidence/g2/pass-2`. The final corrected images have all been inspected; the dangling roof strips, green centre joint, first-frame bind-pose blend, sky clipping and unfinished hall side have been corrected. [Clean browser audit](evidence/g2/final/browser.json) · [Dimensions/hashes and verification](evidence/g2/visual-verification.json). Diagnostic extra roof view is not a replacement for these ten angles.

| Requested view       | Current actual render                      |
| -------------------- | ------------------------------------------ |
| Spawn                | [Open](evidence/g2/final/spawn.jpg)        |
| Main curved building | [Open](evidence/g2/final/exterior.jpg)     |
| Character close-up   | [Open](evidence/g2/final/character.jpg)    |
| Plaza                | [Open](evidence/g2/final/plaza.jpg)        |
| Road                 | [Open](evidence/g2/final/road.jpg)         |
| Expanded street      | [Open](evidence/g2/final/expanded.jpg)     |
| Intersection         | [Open](evidence/g2/final/intersection.jpg) |
| Varied buildings     | [Open](evidence/g2/final/architecture.jpg) |
| Vegetation           | [Open](evidence/g2/final/vegetation.jpg)   |
| Distant depth        | [Open](evidence/g2/final/depth.jpg)        |

Additional [roof/network diagnostic](evidence/g2/final/roofs.jpg). All ten requested screenshots are 1280 × 800 actual rendered pixels, not concept art.

## 8. Gameplay footage / sequences

The baseline MP4 is a retimed encoding of actual browser captures, not generated imagery. Current [WebGPU](evidence/g2/after-camera-webgpu.mp4) and [WebGL2](evidence/g2/after-camera-webgl2.mp4) camera sequences are complete. The [connected keyboard-route sequence](evidence/g2/connected-route.mp4) is complete: 14 captured waypoints, roughly **359 m** measured along the waypoint polyline through the streets. [Route states and method](evidence/g2/traversal/walk.json). The route also passed pause/resume/reset/resize checks with zero page errors. [Native near-wall orbit](evidence/g2/traversal/wall-clearance.json) shortened the arm from 7.4 m to 5.635 m while retaining matching rendered distance. Route acceleration calls the unchanged collision controller extra times between draws; it is functional route evidence, not natural real-time gait or performance footage. No player teleporting is used by the route harness. The route sequence predates the final hall-side facade finish; current stills show that later art correction. Fixed-angle architecture screenshots are diagnostic camera viewpoints, not claimed gameplay traversal.

## 9. Remaining defects and quality limits

The scene still looks procedurally authored. Window repetition, simple interior light transport, repeated plant assets, visible vegetation cutouts, regular paving texture, sparse ground-level signage/activity and simpler distant masses remain. Glass uses PBR/Fresnel, alpha and a static local reflection probe—not ray-traced transmission. The character lacks foot IK and bespoke animation transitions; some sole/contact frames still look floaty, so controller ground-height checks are not a claim of perfect skinned-foot contact. Close contact and collision compression can still compromise framing. Undeveloped edges are finite, not seamless infinite city continuation. More comprehensive LOD/spatial batching and hardware profiling remain necessary. Do not infer AAA, cinematic, photoreal or premium completion from passing tests.

## 10. Tests and status

- Unit tests: **43 passing**, including persistent arm consistency, time partition invariance, hysteresis, reset, zoom, ground heights, collision and a long continuous district route.
- Format/lint/typecheck/unit/build: final `npm run check` **passed**. [Complete log](evidence/g2/check.log).
- Seven packaged GLBs: zero validator errors/warnings; current asset hashes recorded separately without rewriting historical manifests.
- Current native camera comparison and 14-waypoint keyboard district traversal: completed with zero page errors. Standing slow/fast orbit produced zero player displacement on both backends; normal-update camera recordings also include actual walk/run displacement.
- Final corrected production WebGPU stills: all ten requested angles plus roof diagnostic inspected, **zero page/console/network errors**, 763 drawable audit entries and 89 textures ready. These are resource counts, not draw calls or FPS.
- **Eight fresh renderer/lifecycle browser tests passed**: forced WebGL2/StrictMode, resize/reload, automatic fallback, explicit failure/invalid renderer, total capability failure, loading and context loss. The [initial combined run](evidence/g2/e2e-initial.log) had 8 passes and one gameplay timeout on the extended boundary leg; it is not relabeled a clean nine-test run.
- **Targeted gameplay retry passed**, retaining all assertions after extending only the software long-route wait: walk/run, entrance interaction, pause/resume, facade collision, reset, road grounding, new boundary, drag/zoom and single canvas. [Retry log](evidence/g2/e2e-gameplay-retry.log) · [Actual states/errors](evidence/g2/controller/browser-playable.json). The wall stopped the player at z=0.368 m, road ground was −0.15 m, and the new boundary stopped at z=73.637 m. Camera yaw changed 1.571→0.731 rad with the player remaining at spawn. Page/network errors were empty. This software functional test explicitly uses four extra unchanged controller updates per drawn frame; it is not a real-time gait or FPS pass.
- Production chunk-size warning remains. No physical Windows/HP Victus or native hardware FPS test was performed. No jump exists in the existing control contract.

## 11. Run instructions

```sh
npm ci
npm run dev
# or production
npm run build
npm run preview -- --port 4180
```

Open the displayed preview. Force `?renderer=webgpu` or `?renderer=webgl2` for backend checks; normal startup retains the existing fallback policy. Controls: WASD/arrows move, Shift run, left-drag orbit, wheel zoom, E entrance information, Escape pause/resume, R reset. Optional `renderAudit=1` exposes diagnostic scene data. `npm run check` runs static checks, units and production build. Packaged assets work without authoring caches, Blender or source downloads. For local browser regression, install Chromium once with `npx playwright install chromium`, then run `npm run test:e2e`. The default is normal controller updates; software-only acceleration must be explicitly enabled and is not gait/FPS acceptance. Optional evidence/rebuild tools are documented in `scripts/g1/README.md`.
