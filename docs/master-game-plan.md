# CodeVerse — Master Game Plan

> **Current execution update — 2026-11-27:** the owner explicitly approved bounded G1 implementation. An actual early playable is implemented; see [G1 handoff](g1-playable-handoff.md). The planning submission status and prerequisite gates below are historical where superseded by that approval. Final visual, physical-performance and pipeline acceptance are still separate and incomplete. Later-system scope is not expanded.

Date: 2026-11-27

Status: consolidated planning baseline, submitted for owner review. This document does not authorize implementation, asset acquisition or purchases. Approval of a direction is distinct from approval to execute a milestone.

## 1. Purpose and source of truth

CodeVerse is a PC-first, keyboard-and-mouse browser game: a premium, explorable modern learning city with a customizable player, social spaces, vehicles and optional programming activities. It is not a conventional website with a small 3D demo.

This document consolidates the owner's recent planning decisions. It supersedes conflicting earlier planning scope, but does not rewrite historical implementation/test reports. In particular, the later benchmark plan includes one fixed player and narrowly scoped movement/animation validation; the original environment-only benchmark draft is historical.

Primary visual and composition reference: [official CodeVerse concept](reference/codeverse-central-plaza-customization.png). The owner's uploaded GTA-related and real-world images are supporting references, not model sources, licenses, runtime evidence or replacement concepts. Originals supplied under temporary upload paths are not assumed to be permanent repository assets.

## 2. Decisions already agreed

| Area               | Planning baseline                                                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery           | Windows modern Chromium, PC-first; React, strict TypeScript and Babylon.js; WebGPU preferred with an explicit WebGL2 compatibility path                                                                   |
| Visual identity    | Detailed stylized-realistic modern city; believable people/materials, cinematic readable lighting and restrained blue accents                                                                             |
| Landmark           | Preserve the concept's curved glass silhouette, architectural bands, entrance treatment and plaza relationship                                                                                            |
| Asset strategy     | Hybrid original production and compatible licensed sources; multiple specialist architectural families normalized together                                                                                |
| Acquisition budget | ₹0; no paid assets, subscriptions or commissions assumed. Labor, hosting and operating costs are not thereby free                                                                                         |
| Buildings          | Original landmark/modern-tower briefs; retain Poly Haven apartment/factory facade candidates for later inspection; exclude Quaternius commercial kit for now                                              |
| Character          | MPFB/MakeHuman core CC0 assets plus original work is a research direction, not a proven production pipeline; Human Generator cannot become a dependency unless the owner explicitly changes the ₹0 budget |
| Hero appearance    | Concept-inspired male, dark tousled hair, dark blue-accented jacket, white shirt, cargo trousers and blue/white sneakers                                                                                  |
| Customization      | Broad face/body options and modular clothing are eventual goals, not benchmark requirements                                                                                                               |
| NPCs               | Varied contemporary population informed by supplied realism references; one compatible production family where practical                                                                                  |
| Vehicles           | Original fictional designs, believable materials/proportions and separate driven/traffic/parked/distant tiers                                                                                             |
| Environment        | Offline-authored spline/modular roads, curated free materials/vegetation, original civic furniture and selected free utility props                                                                        |
| Adaptation         | Browser quality should adapt to measured PC performance, with visible settings and manual overrides                                                                                                       |
| Process            | Objective, plan, explicit execution approval, implementation, tests, actual visual evidence, owner acceptance and honest report for each milestone                                                        |

“80% of GTA VI” describes ambition, not a measurable promise. Assess concrete qualities and measured performance instead. Do not copy/extract proprietary game assets or distinctive characters/branding. Do not silently replace the target with low-poly placeholders, generic cubes, flat roads, prerendered backgrounds or decorative fake UI.

## 3. Intended player experience

The following loop is a proposed game-design baseline, not an implemented or fully approved feature specification:

1. Enter the city with an approved character; later customize appearance.
2. Explore a coherent district on foot and discover meaningful destinations.
3. Enter a destination and choose an activity, social interaction or optional programming challenge.
4. Receive understandable feedback; save legitimate progress when that system exists.
5. Return to the city, discover another destination or personalize appearance.
6. Later, travel using vehicles and share supported spaces with other players.

Education should be an optional, integrated destination experience, not a prerequisite for simply exploring. Exact lesson subjects/order, assessment rules, progression, rewards, accounts and monetization remain design decisions. Do not implement displayed XP, currency, quests, shops or leaderboard controls until their underlying behavior exists.

### First meaningful playable release — proposed scope

One polished district, a working player/camera, reliable loading, one meaningful learning destination/activity, basic validated saving and a coherent limited appearance set. Multiplayer, driving and expansive customization are separately gated additions, not prerequisites for proving this loop. Owner approval is required for this release scope and ordering.

## 4. Art and world construction

### Central district

- Foreground protagonist, middle-distance curved landmark and layered skyline.
- Detailed entrances, storefront depth, restrained signage and blue architectural accents.
- Gray stone plaza, green shade trees, flowering accents, benches and planters.
- Credible roads, curbs, crossings, drainage and accessible pedestrian transitions.
- Daylight quality first; night/dusk lighting later after material readability is proven.

### Eventual library coverage

| Family                   | Required coverage                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture             | Landmark/academy, offices, shops/restaurants, residential/hotels, industrial/service, infrastructure; roofs, facades, doors, stairs, shafts and lighting |
| Transport infrastructure | Road widths/curves/junctions, roundabouts, parking, sidewalks, signals/signs, bus stops, utilities; highways, bridges and tunnels later                  |
| Characters               | Bodies, faces, eyes, hands, hair, garments, footwear, accessories, occupational NPC appearances and supported shape variations                           |
| Vehicles                 | Ordinary cars, SUVs, premium/sports cars, motorcycles/scooters, buses, delivery/emergency/municipal variants as stages require                           |
| Landscape/props          | Trees, flowering species, shrubs, grass/ground cover, rocks, planters, seating, bins, lights, barriers and utility equipment                             |
| Interiors                | Shared shell; academy/classrooms, computing labs, offices, shops, restaurants, residential and social/entertainment modules as approved                  |
| Motion/audio             | Locomotion/transitions, sitting, gestures, work/phone/computer interactions; vehicle articulation, ambient and interaction audio with clear rights       |

This inventory is not authorization to build every category. Each release acquires only the content it needs. Beaches, ports, extensive waterfronts, helicopters and elevated transit appearing in references are not automatically scheduled systems.

### Cohesion contract

Adopt documented meter scale, axis/pivot conventions, module dimensions, material families, texel-density rules and weathering levels. Establish exact dimensions before modeling. Multiple publishers must be normalized, not imported unchanged. Preserve architectural/character identity in lower presets.

## 5. Asset production and rights

### Current source dispositions and reference verification

Publisher-page review: **2026-11-27**, using web pages only; no asset files downloaded. **Verified publisher information** means the named source actually states the information, not that its downloadable contents or runtime behavior have been independently validated. **Assessment/estimate** means our planning judgment. **Unknown / UNVERIFIED** means evidence is missing; do not guess, silently substitute another asset, or treat it as approved.

| Exact candidate and original URL                                                                                                   | Verified publisher information                                                                                                                                                                                                                                                                     | Unknown / UNVERIFIED pending authorized inspection                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Modular Urban Apartments Facade](https://polyhaven.com/a/modular_urban_apartments_facade) — Poly Haven; author **James Ray Cock** | Publisher describes contemporary modular residential facade components. Page reports **118K tris**; offers **Blend, glTF, USD and FBX**, with **1K/2K/4K/8K** texture options. The retrieved page displays **663.38 MB** with 4K selected. Asset marked **CC0**.                                   | Exact per-module geometry/material/texture counts, module coverage, LODs, collision, source completeness and actual export/runtime quality. The rounded page triangle figure is not an exact measured count or a per-building budget. |
| [Modular Factory Facade](https://polyhaven.com/a/modular_factory_facade) — Poly Haven; author **James Ray Cock**                   | Publisher describes industrial facade components including brick panels, windows, doors and loading bays. Page reports **175K tris**; offers **Blend, glTF, USD and FBX**, with **1K/2K/4K/8K** texture options. The retrieved page displays **900.83 MB** with 4K selected. Asset marked **CC0**. | Exact per-module geometry/material/texture counts, module coverage, LODs, collision, source completeness and actual export/runtime quality. The rounded page triangle figure is not an exact measured count or a per-building budget. |

Both identities and URLs were confirmed without replacement. Both remain **retained candidates, not selected production assets**. Download sizes above are the page's displayed source-download figures at review time, not verified file sizes, promises for every format, browser transfer sizes or GPU-memory measurements. glTF availability does not establish a tested GLB, suitable materials or Babylon compatibility. Our assessment remains that these may supply residential/service components; neither is established as the CodeVerse landmark or a complete building ecosystem.

Other references in this plan, reviewed on the same date:

- [MPFB — MakeHuman Community](https://static.makehumancommunity.org/mpfb.html): publisher identifies a free/open-source Blender human generator. [Official split-license page](https://static.makehumancommunity.org/about/license.html) states **core assets CC0**, MPFB code **GPL**, MakeHuman code **AGPL**. This does not clear all third-party assets or prove production suitability. Audit every non-core garment/hair/texture.
- [Poly Haven asset license](https://polyhaven.com/license): states assets are CC0, with commercial use, modification and redistribution allowed. Website text, logos and example renders are separately protected; do not apply asset CC0 to all site content.
- [ambientCG license](https://docs.ambientcg.com/license/): states assets and their material preview renders use **CC0 1.0 Universal**, including commercial use and raw-file inclusion in games. No particular ambientCG asset is selected in this plan; its production suitability is **UNVERIFIED**.
- [Human Generator](https://humgen3d.com/pricing): publisher lists paid Personal/Commercial offers. **Must not become a production dependency unless the owner explicitly changes the ₹0 acquisition budget**, followed by separate licensing, selection and execution approval. No trial is presumed to provide a free production entitlement.
- [Roadscape](https://superhivemarket.com/products/roadscape): verified product identity as a Blender road-authoring suite; not a ₹0 production dependency. Output/bundled-resource rights and CodeVerse suitability remain **UNVERIFIED** here; no permissive-output license is assumed.
- [Downtown City MegaKit — Quaternius](https://quaternius.com/packs/downtowncitymegakit.html): exact identity of the commercial-street kit excluded for now. Publisher states CC0 and distinguishes a free portion from paid Source content. No full-kit access, quality or free-tier inventory is assumed.
- Unspecified paid architectural/vehicle packs are historical research categories, not approved candidates or verified commercial-use entitlements. Any future specific proposal needs its own original URL and license audit.

Free tiers do not imply access to paid source files or complete libraries. All asset availability, production-readiness and performance claims beyond the verified page statements above remain unproven.

### Per-asset acceptance workflow

1. Owner approves the visual candidate and acquisition/inspection scope.
2. Record original publisher, exact license/version, provenance, dependencies and team access rights.
3. Check commercial browser delivery, modification and customization/cosmetic restrictions. Public GLB delivery is not automatically permitted by marketplace licensing.
4. After authorization, inspect the acquired package: geometry, UVs, textures, materials, pivots, rig, animations and LODs.
5. Prepare editable masters and purpose-specific export copies; build missing original parts.
6. Validate glTF/GLB, materials, animation/deformation, collision and screen-space appearance.
7. Apply the visual rejection gate below and measure representative runtime use. Record accept / hold / reject, reasons and evidence; rejection is a valid outcome, not an obligation to repair or use the asset.

### Explicit asset-quality rejection gate

Any candidate asset, original model or generated model may be rejected if:

- It does not match the approved CodeVerse art direction.
- Its geometry or proportions are visibly poor.
- Deformation or animation problems are unacceptable.
- Its license is incompatible with the intended use, including browser delivery/customization where relevant.
- Source files or required dependencies are incomplete.
- It cannot be optimized without unacceptable visual degradation.
- It looks good in a publisher preview but looks or performs poorly in the actual game camera.
- It cannot meet common scale, material or asset standards.
- Its visual quality depends on unavailable engine-specific shaders or effects.

Unknown rights/dependencies or missing validation place a candidate on hold; they do not count as a pass. Review actual in-camera evidence after separately authorized inspection/integration. Record any proposed fix and re-review before acceptance. **Do not force an asset into production because it is free**, already acquired or visually attractive in a promotional image. No quality rejection authorizes replacement downloads, modeling or art-direction downgrades without the applicable approval.

Keep a license/asset manifest. Compression is not DRM. Do not offer raw licensed assets through export tools. User-supplied reference images do not establish redistribution rights for recreated models. AI-generated geometry receives no automatic production approval.

### Character-specific contract

**MPFB/MakeHuman core CC0 assets plus original character work is a research direction, not a proven production pipeline.** It does not automatically establish:

- The finished protagonist's approved visual quality.
- Production-ready clothing or concept-matching hair/accessories.
- Broad body/face customization suitable for this game.
- Reliable garment fitting across all supported body combinations.
- Compatible animation, retargeting, skeleton or deformation behavior.
- A validated Babylon.js/glTF/GLB export-and-loading pipeline.
- Acceptable runtime performance or resource use.

These require later authorized inspection, representative tests and owner approval; no present production-readiness claim is made. The [publisher's export guidance](https://static.makehumancommunity.org/mpfb/docs/exporting/index.html) warns about Blender-specific procedural materials and helper geometry; its suggested GameEngine material/rig and illustrated FBX workflow are not evidence of our Babylon/glTF pipeline working. Human Generator remains excluded as a production dependency unless the owner explicitly changes the ₹0 budget; a budget change alone would not resolve its license or validate the pipeline.

The following is a **proposed contract to validate**, not existing capability: one canonical deform skeleton/rest pose, documented garment slots, body-region masks, fitted clothing and approved morph ranges. Broad customization needs corrective shapes and combination testing; arbitrary generator sliders cannot simply be exposed in the browser. Retain an editable master; export only selected runtime morphs. Standard skinned characters and baked/instanced distant crowds are different rendering paths.

## 6. Technical architecture

Preserve the existing foundation rather than reuse discarded implementations.

| Ownership                     | Responsibility                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| React application/UI          | Loading/errors, settings, menus, interaction panels and low-frequency state presentation            |
| Imperative graphics session   | Babylon engine/scene, frame loop, camera, GPU resources, rendering quality and cleanup              |
| Future world/content services | Cell residency, asset manifests, dependency references, cancellation and unloading                  |
| Future gameplay services      | Input, movement, interactions, activity state and later vehicles, isolated from React render cycles |
| Future network/backend        | Only introduced for an approved persistence, execution or multiplayer need                          |

Do not scaffold speculative frameworks/services now. Babylon objects and per-frame updates do not belong in React state. Preserve StrictMode, cancellation, disposal/remount behavior and visible context/device-loss handling.

Shipping content should favor inspected glTF 2.0/GLB, supported PBR materials, approved geometry compression and KTX2 where validated. Self-host required codecs. Unreal Blueprints/Nanite/Lumen, Blender procedural tools and engine-specific shaders do not transfer automatically.

## 7. Adaptive browser performance

### Capability and calibration

Check actual backend/features/limits, then measure a representative workload. Browser GPU names/RAM hints are incomplete; do not assign trustworthy quality levels from labels alone. An empty scene cannot calibrate city performance. Unknown devices start conservatively.

Automatic backend selection may report a WebGPU failure and select WebGL2. Explicitly forced backends must fail visibly rather than silently switch. Quality adaptation must not switch backends during play.

### Settings

Proposed Auto, High, Balanced, Performance and Custom modes; visible active backend, settings, target and reset option. Offer 30/60 FPS targets as goals, not guarantees. Distinguish a manually chosen preset from Auto; do not override locked settings silently. Persist valid preferences locally with reset and sensible versioning.

### Adaptation order

Profile before choosing a remedy. For rendering pressure, reduce secondary effects, distant LOD/shadow/reflection cost, then approved nonessential density and optional render scale. For memory pressure, lower texture residency and evict unused cells. For animation CPU pressure, reduce distant update rates/complexity. Do not blindly change resolution for CPU-bound work.

Use sustained samples, separate upgrade/downgrade thresholds, cooldowns and bounded changes. Exclude hidden-tab time, startup, streaming and shader preparation from steady-state calibration while still reporting their stalls. Numeric thresholds require approval and testing.

Ambient density may vary only within approved limits. Never remove important gameplay objects or silently change functional state. Protagonist identity, landmark silhouette and readable interaction surfaces remain protected. Significant visual/composition reductions need owner approval.

### Streaming and rendering

- Independently unloadable spatial cells plus reference-counted shared dependencies.
- Predictive loading, cancellation, bounded queues and explicit eviction; no monolithic whole-city GLB.
- Mesh/character LODs and later offline HLODs; preserve silhouette and deformation.
- Spatially partitioned instancing/thin instancing; avoid one city-wide culling bound.
- Control draw submissions, transparent overdraw, dynamic shadows, texture residency and animation evaluation.
- Interior visibility and distant population representations require separate measured validation.

Actual GPU memory is not universally available through browser APIs. Report estimates as estimates; do not fake exact VRAM monitoring. Test sustained play, repeated cell visits and memory release, not only average FPS.

## 8. Graphics feasibility benchmark contract

Implementation remains blocked pending a final milestone execution plan, approved asset path and explicit approval.

Representative slice: concept-aligned hero exterior/plaza and short detailed pedestrian/road segment, limited vegetation/props, daylight lighting, one fixed player/outfit and narrowly scoped movement/camera/animation validation. This is not authorization for full gameplay, NPCs, traffic, interiors or multiplayer. Exact content and viewpoints must be signed off.

### Three independent acceptance categories

**A. Visual quality — actual rendered evidence**

Compare real-time captures and movement footage from the approved game camera against the official CodeVerse direction. Evaluate landmark silhouette/architectural identity; geometry and structural detail; materials and textures; lighting and shadows; character quality; animation and movement quality; composition/camera presentation; and consistency between original and reusable assets. Use matched viewpoints plus close/side views and traversal, not a single selective beauty shot. Publisher previews are reference only. A running scene or high FPS does not constitute visual acceptance.

**B. Performance — owner's physical hardware**

Record the actual CPU, GPU/dedicated VRAM, RAM, OS/driver/browser, power/thermal conditions, rendering backend, resolution, render scale and settings. Capture frame-time distribution, average FPS, relevant percentiles (including median/p95/p99 frame times with calculation/window definitions), stutters and sustained performance. Record GPU/CPU bottlenecks where measurable, memory usage/resource estimates with measurement methods and limitations, loading, decode/upload and shader preparation. Separate cold/first-traversal stalls from warm steady state without hiding either. Unsupported metrics/backends must be marked unavailable or untested; no invented results, exact VRAM telemetry or compatibility claims. Sandbox/software rendering cannot pass the owner's physical-hardware gate.

**C. Production pipeline — practical, repeatable asset workflow**

For the representative original/reusable assets and fixed character, evaluate source modeling/editability, geometry quality, UVs, materials, glTF/GLB export, Babylon.js loading, collision preparation, LOD preparation, optimization and missing dependencies. Document source/tool versions, required files, settings, preparation steps and defects. Demonstrate an authorized edit/preparation → optimization → export → load cycle and repeat it from documented inputs to show consistent results, including collision/LOD behavior in the approved slice. A schema-valid file or a one-off rendered scene is not sufficient. Missing sources/dependencies, unrepeatable manual fixes or unacceptable visual loss block pipeline acceptance until corrected.

These are future evaluation requirements only. Defining them does not authorize modeling, downloads, exports, integration or benchmark execution now. G1 validates the representative workflow, not every future clothing combination or the eventual whole-city pipeline.

### G1 acceptance rule and failure handling

G1 passes only when **all three categories independently pass**:

1. Visual acceptance.
2. Performance acceptance on the owner's physical hardware.
3. Production-pipeline acceptance.

Do not average category scores or substitute one category for another. A category without required evidence remains **not evaluated / blocked**, never implicitly passed. Agree category-specific criteria in the separate G1 execution plan before implementation. Record each category's status, evidence, limitations and owner acceptance separately.

If any category fails, document the failure, evidence, bottlenecks, proposed corrective actions and required retests. Keep G1 blocked until the failed categories pass and changes are checked for regressions in the others. Do not silently downgrade art direction to obtain a pass or advance to dependent milestones. No G1 results or hardware compatibility are established by this plan.

### Provisional investigation targets — not measured promises

- Named Windows PC with physical GPU; modern Chromium; 1920×1080 native, render scale 1.
- 60 FPS target; approve exact median/p95/p99 and stall criteria before execution.
- Prior planning envelopes: roughly 0.8–1.5 million visible triangles and roughly 250 submissions including shadow passes; validate counting methods and content suitability.
- Prior payload proposals: 60 MiB critical / 100 MiB total; define compressed transfer accounting and cache conditions.
- Native fixed-quality benchmark has no hidden dynamic resolution. Adaptive-quality evaluation is a separate run with settings/change logs.

Record CPU, GPU/dedicated VRAM, RAM, OS/driver/browser, display, power/thermal mode, backend and settings. Test WebGPU and WebGL2 explicitly where supported. SwiftShader/headless results establish correctness, not gaming-PC performance.

Proposed protocol: 30-second warm-up then three 60-second repeatable path captures per configuration, plus a separately agreed sustained run. Separate cold load, decode/transcode, shader preparation, first traversal and warm steady-state results. Retain raw frame traces, matched screenshots, resource counters and actual limitations. If the target fails, identify bottlenecks and propose remedies before changing the visual target or advancing.

## 9. Milestone roadmap and dependency gates

Every milestone requires its own scope/execution approval. The order after graphics feasibility is proposed and may be revised explicitly; it is not authorization to start all stages.

| ID                            | Objective / bounded deliverable                                                                                                                                     | Dependencies and acceptance gate                                                                                                                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 — Foundation               | Existing shell, empty renderer, lifecycle/backend policy and checks                                                                                                 | Historically implemented; physical WebGPU/Windows validation remains open. Do not infer world quality from its tests                                                                                                                                                                                                         |
| P1 — Consolidated plan        | This plan, approval ledger, feature boundaries and open decisions                                                                                                   | Owner reviews/corrects the baseline; no implementation implied                                                                                                                                                                                                                                                               |
| A1 — Asset readiness          | Review representative landmark/player/environment candidates or original-production briefs; resolve rights and source path                                          | Separately authorize downloads/modeling if needed. Apply Section 5's explicit rejection gate; record accept/hold/reject and evidence. Free assets are not automatically accepted. MPFB is a research direction, not a proven pipeline                                                                                        |
| G1 — Graphics feasibility     | Small real concept-aligned slice with one fixed player and narrowly scoped traversal/animation; independently evaluate visuals, performance and production workflow | Approved asset/execution plan; **all three must pass separately: visual acceptance, performance acceptance on the owner's physical hardware, and repeatable production-pipeline acceptance**. Any failure or missing evidence blocks G1; document evidence, bottlenecks and corrective actions, without silent art downgrade |
| G2 — Adaptive performance     | Settings, representative calibration, bounded quality control, telemetry, residency/resource validation                                                             | All three G1 acceptance categories passed and owner accepted; test actual effects on multiple hardware levels/backends. Diagnostics may be scoped into G1, but full adaptation cannot be proven on an empty scene                                                                                                            |
| W1 — First playable block     | Reliable player controls/camera/collision, coherent pedestrian block and one honest destination interaction                                                         | G1/G2 accepted; test navigation, boundaries, loading, focus, resize and lifecycle; no fake interaction buttons                                                                                                                                                                                                               |
| I1 — Learning interior        | One academy/classroom or computing-lab cluster with modular shell and interaction-ready equipment                                                                   | Accepted exterior/player scale and separately approved interior assets; test enter/exit and exterior/interior resource release                                                                                                                                                                                               |
| L1 — Learning vertical slice  | One complete optional activity with instructions, real evaluation, feedback and retry                                                                               | Approve topic and evaluation design. If executing user code, isolate it with time/resource limits and no privileged server/browser access; adversarial tests required                                                                                                                                                        |
| S1 — Saving/progression       | Save actual supported progress/settings and limited approved appearance state                                                                                       | Decide local-only versus accounts; version schemas and recovery. Server validates rewards where relevant; no invented currencies or economy                                                                                                                                                                                  |
| C1 — Customization/population | Broad customization delivered incrementally; fitted clothing/hair and a bounded varied NPC population                                                               | Prove representative morph/garment combinations, retargeting, LODs and density budgets before expanding. Advanced NPC AI excluded                                                                                                                                                                                            |
| V1 — Vehicle slice            | One original fictional drivable vehicle on a bounded route; later traffic/parked variants                                                                           | Separate approval for physics/input, camera, collision, sound and vehicle assets. Test driver fitting, enter/exit and browser performance                                                                                                                                                                                    |
| N1 — Multiplayer/social slice | Small supported player capacity, synchronized appearances/movement and one approved social feature                                                                  | Backend/hosting budget and authority/privacy/moderation decisions first; latency, abuse and load tests. Do not build an MMO framework in advance                                                                                                                                                                             |
| W2 — City expansion           | Add bounded districts, specialist buildings, transport and interiors in measured increments                                                                         | Streaming, long-session memory, traversal and multiplayer budgets proven as applicable; per-district acceptance, not an unlimited map commitment                                                                                                                                                                             |
| R1 — Release hardening        | Supported-device matrix, accessibility/settings, deployment/cache/versioning, security, recovery and operational documentation                                      | Reproducible build, real-hardware evidence, migration/rollback and unresolved-risk review                                                                                                                                                                                                                                    |

A first playable release can stop after W1/I1/L1 and the necessary S1/R1 portions. Broad customization, driving, multiplayer and city expansion are not required to claim that limited release. Exact release content requires owner approval.

## 10. Testing and evidence

- Run relevant formatting, lint, strict types, unit tests and production build after code changes.
- Add browser checks for real feature behavior; distinguish mocks, NullEngine, software rendering and physical-GPU results.
- Preserve forced-backend semantics, one-canvas behavior, async cancellation, cleanup, resize and context-loss tests.
- Asset checks include glTF validity, missing resources, pivots/scale, deformation, material count and licensed dependencies.
- Adaptive tests include CPU/GPU-bound cases where measurable, threshold stability, cooldowns, manual locks, background tabs and reset behavior.
- Streaming tests include cancelled loads, cell reentry, shared-resource lifetime and memory stabilization.
- Gameplay tests include collision/interaction edges; learning, saving, networking and user content add security-specific tests when introduced.
- Capture actual browser screenshots/video for completed visual milestones. Label publisher/AI/reference images separately; never present them as implementation evidence.

Each completion report states: delivered, tested with exact results/environment, visual evidence, failed/unrun checks, limitations, changed files and the next blocked gate. G1 additionally reports independent visual, performance and production-pipeline statuses with evidence and corrective actions; a pass in one does not pass the others. Remote CI is not claimed unless actually executed.

## 11. Costs, estimates and operational constraints

₹0 is an acquisition constraint, not a guarantee of zero modeling effort, hosting, multiplayer operation or custom-production time. No paid service/account is authorized. If a feature cannot operate within available free capacity, report it before committing to it.

Do not promise a whole-game completion date. Following the first representative asset inspection, estimate the next milestone in bounded tasks with assumptions, dependencies and revision risk. Original hero architecture, a premium custom character and broad fitted clothing are substantial production work. Reference images are not finished assets; generated 3D is not assumed production-ready.

Development assets must remain manageable; keep large source/generated packages out of Git and adopt approved external-storage conventions when needed. Repository source, manifests and small actual evidence remain reviewable.

## 12. Main risks and responses

| Risk                                                                | Response / stop condition                                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Premium target vs ₹0 acquisitions and available production capacity | Inspect actual sources and scope original work honestly; do not silently downgrade or promise automated AAA output |
| Browser GPU/memory/download constraints                             | Small representative benchmark, bounded residency and backend-specific evidence before expansion                   |
| License incompatible with browser delivery/customization            | Hold/reject source or secure explicit rights; never assume encryption resolves the license                         |
| Garment/morph combination explosion                                 | Constrained tested ranges, compatibility matrix, corrective work and staged release coverage                       |
| Multiple specialist kits look inconsistent                          | Common construction/material standards and neutral-light comparison before selection                               |
| Large-city ambition hides missing gameplay                          | Prove one meaningful player-to-destination activity loop before broad expansion                                    |
| Multiplayer/learning execution/UGC security                         | Introduce only at dedicated gates with authority, isolation, moderation and operational requirements               |
| Unreal/Blender feature dependence                                   | Reconstruct/bake only through verified export paths; no implied engine-feature portability                         |

## 13. Open decisions — do not invent answers

1. Actual HP Victus specifications and access to physical-GPU testing; additional low/mid/high test devices.
2. Owner acceptance of this consolidated plan, proposed release scope and post-benchmark milestone order.
3. Exact benchmark asset candidates, production ownership, lawful source access and original-modeling execution scope.
4. Module dimensions, camera settings, visible character distances, texture/material budgets and numeric frame-pacing criteria.
5. First learning topic, activity/evaluation approach and whether accounts are needed initially.
6. Traffic convention, first vehicle type, multiplayer capacity and supported social features when their gates approach.
7. Hosting/persistence/operational limits under the no-spend constraint.
8. Fine-grained customization ranges, garment coverage and NPC density following prototype measurements.

Do not ask for all decisions now. Resolve each near its milestone, except hardware/assets needed for G1.

## 14. Immediate next action

Owner reviews this document and approves or amends it as the planning baseline. Then prepare the bounded A1 asset-readiness execution proposal: exactly which representative assets must be created or inspected, permitted file actions, dependencies, validation and stopping criteria. Obtain separate authorization before acquisition/modeling. Prepare the G1 execution plan only once the source/production path is credible.

No adaptive-performance implementation, benchmark construction, full-city development, purchases, asset downloads or new dependencies are authorized by creating or approving this document.
