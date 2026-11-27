# A1 follow-up — runtime blocker and full exterior production-path study

> **Current consolidated status:** [A1 final readiness report](a1-final-readiness-report.md). The owner acknowledges the landmark/plaza construction study complete and directs no further sandbox Blender attempts. Keep the portable recipe; subsequent source/rights findings and remaining gates are in the consolidated report. Results below remain historical; G1 requires explicit approval.

**Date:** 2026-11-27 · **State:** A1 OPEN; G1 NOT STARTED · **Acquisition spend:** ₹0.

This continues [the source/tool inspection](a1-source-tool-inspection.md), not a replacement for its historical results or for the approved [A1 proposal](a1-asset-readiness-proposal.md). Routine bounded execution continued without asking for redundant approval. No final asset selection, milestone acceptance, paid service, new account, city expansion or game integration occurred.

## 1. Outcome and decisions

1. **Actual MPFB export attempted; failed before Blender initialization.** There is still no MPFB BLEND, rigged GLB, finished male hero, or idle/walk/run result. Keep that acceptance gate open.
2. **Runtime alternatives investigated with a stopping condition.** None of the bounded checks supplied a runnable Blender environment. Stop speculative package downloads; use a genuine supported Blender installation/authorized compatible runner for the next real attempt. This is an environment limitation, not evidence Blender or MPFB cannot do the work.
3. **Source-weight reduction isolated mathematically.** The original body has 608 vertices losing some influence weight when limited to four. Artificial probes quantify a risk; they do not approve a four-influence export policy.
4. **Original complete-exterior construction recipe now executed.** Front, sides, rear, roof, entry, plaza, pedestrian link, bounded road and original site props exist in an actual editable-by-script GLB production-path study. This replaces neither the concept benchmark nor the specialist art pass.
5. **Continue the hybrid ₹0 acquisition route.** Scripted architecture is viable for repeatable construction/GLB testing. Blender/MPFB remains the chosen character route, blocked here. Final PBR, foliage, face/hair/outfit and locomotion are unresolved, not silently downgraded or substituted.

## 2. Blender/MPFB: actual failure and bounded alternatives

Evidence: [execution result](evidence/a1-runtime/mpfb-execution.json), [runtime inventory](evidence/a1-runtime/runtime-inventory.json), [wheel inventory](evidence/a1-runtime/wheel-library-inventory.json).

The executable recipe [mpfb-export-study.py](../scripts/a1/mpfb-export-study.py) was actually run using the installed PyPI `bpy 4.5.3` and official MPFB `v2.0.18` source. Exit code **1**; failed stage **`import_bpy`**; `operations_completed: []`; first exception **`ImportError: libXrender.so.1`**. No character-generation or export step ran.

`ldd` identifies seven unresolved runtime libraries: `libXrender.so.1`, `libXfixes.so.3`, `libXi.so.6`, `libxkbcommon.so.0`, `libSM.so.6`, `libICE.so.6`, `libGL.so.1`. A background/headless flag does not remove an import-time shared-library requirement of this particular wheel. Existing cached browser libraries did not supply the full set.

| Alternative checked                                                       | Actual observation                                                                                                                                     | Decision                                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Existing system libraries / cached browser libraries                      | No complete dependency set found                                                                                                                       | Do not counterfeit libraries or claim headless mode fixes import                                   |
| Official `blender/blender` GitHub latest release API                      | HTTP 404                                                                                                                                               | This particular download route unavailable; not a universal Blender availability claim             |
| PyPI `bpy-headless`                                                       | No matching distribution from index query                                                                                                              | Do not assume this package exists                                                                  |
| Container execution                                                       | No `docker`/`podman` executable found                                                                                                                  | No container run claimed                                                                           |
| Panda3D 1.10.16, OpenCV Python 5.1.0.95, PySide6 Essentials 6.12.0 wheels | Range-read ZIP inventories only. OpenCV includes hashed xkbcommon libraries, but not the complete required set; other inspected wheels no matching set | No large unrelated wheel installation or dependency scavenging                                     |
| Previously blocked official asset/download hosts                          | Not retried during this pass                                                                                                                           | Respect bounded network failure; no repeated blind downloads                                       |
| Supported desktop Blender 4.5.x + pinned MPFB                             | Recommended next execution environment, **not tested here**                                                                                            | ₹0 software acquisition; hardware/setup/labor still required. No paid cloud or new account assumed |

### Portable recipe, not successful export

Source review verified MPFB service names/signatures for default macro settings, body creation, game-engine rig, character-copy creation, relative Basemesh lookup and helper removal; source rig includes `lowerarm_l` and `calf_l`. Blender's installed exporter source defines the requested influence and active-action settings. **Downstream runtime/API behavior is unverified** because import failed first.

The recipe intends to save a diagnostic master BLEND, create an original bend probe (not locomotion), and export all-influence/four-influence GLBs. It uses default macros and a neutral diagnostic material; it does **not** build the concept male face, skin, hair, clothing or animations. Run only against a disposable empty study scene; it deletes objects in that scene.

On a supported Blender 4.5.x environment, with the same extracted source and repo paths:

```sh
blender --background --factory-startup --python scripts/a1/mpfb-export-study.py -- \
  --source .cache/a1/sources/mpfb2-2.0.18 \
  --output .cache/a1-runtime/mpfb-supported-run \
  --report .cache/a1-runtime/mpfb-supported-execution.json
```

Do not overwrite the committed failed-attempt evidence with an anticipated success. After a real successful run: validate both GLBs; inspect bind pose/axes/scale/influences; reimport; compare deformed body regions under the same poses in Babylon; then inspect skin, hair, garment fit and locomotion as separate gates. Original bend-probe animation is not a retargeting/idle/walk/run substitute.

## 3. Influence sensitivity: verified mathematics, limited interpretation

Executed [weight-sensitivity.py](../scripts/a1/weight-sensitivity.py), using NumPy 1.26.4, neutral source OBJ × 0.1, source head locations and parent graph, independently normalized complete vs top-four weights. No macro targets, Blender bone rolls, anatomical local axes or exporter were applied. Meter interpretation follows MPFB's default scale assumption, not a measured exported character.

[Machine evidence](evidence/a1-runtime/weight-sensitivity.json): 13,380 body vertices; 608 lose positive weight mass; maximum discarded normalized mass **3.36%**. Identity, normalization, top-four cap and parent-graph cycle checks passed.

| Arbitrary hierarchical world-Z probe |         Maximum difference | Vertices differing over 0.1 mm |
| ------------------------------------ | -------------------------: | -----------------------------: |
| Identity                             | Numerical noise, < 10⁻⁹ mm |                              0 |
| Arm stress                           |                   2.835 mm |                             53 |
| Knee stress                          |                   2.292 mm |                             63 |
| Torso stress                         |                   1.052 mm |                            143 |

These are sparse differences: the all-body 95th percentile is zero, which must not conceal localized effects. This is **not an upper bound on all poses**, a skin-quality metric, proof of anatomical correctness, or a six-versus-four export acceptance. Keep both actual exporter variants in the future test plan; do not declare the reduction harmless from this study.

## 4. Full exterior and plaza: executed original construction route

Sources: [parameter brief](../scripts/a1/landmark-study.json), [generator](../scripts/a1/build-landmark-study.mjs), [viewer](../scripts/a1/landmark-viewer.html). Geometry is original scripted work, no proprietary extraction, marketplace asset, downloaded texture or generated-AI image/mesh. The earlier small curved-junction diagnostic remains historical evidence, not this whole-building result.

### Construction coverage and scale

- Six levels: 4.8 m ground floor + five 3.8 m levels; roof at 23.8 m; parapet top 24.8 m.
- 22 m front radius over 90° yields **31.113 m frontage**, 24 m depth. This deliberately resolves the earlier approximate 32 m frontage into an exact radius/angle design; not a final approved dimension.
- Curved glazing, vertical mullions and horizontal architectural bands; side/rear façade bays; service door; roof deck, parapets and setback service enclosure.
- Recessed entry doors/frame, structural columns, layered canopy and restrained blue edge. Sign-support geometry has **no final brand/logo**.
- Core site nominally 42 × 36 m, including 12 m forecourt. Separate 12 m pedestrian connection leads to a bounded 28 × 8 m road segment; that connection/road extend beyond the core site rectangle. Side paving and continuous curved apron close the forecourt-to-façade gap.
- Slab joints, three original slatted benches, three soil-filled planters and two original light-pole assemblies. Planting sockets remain documented but **empty**: no fake tree/flower proxy asserted as acquired vegetation.
- 1.8 m clear ramp, 0.15 m drop over 1.8 m run (1:12); nominal ramp/road heights agree mathematically. This is not an accessibility-code certificate, traversal/collision test or constructed engineering design.
- 96 front arc segments: analytic maximum chord deviation **0.736 mm** before export quantization. Geometry dimensions are study values; no accepted hero is present for perceptual scale confirmation.

The configuration is editable, but the recipe is intentionally bounded, not a general CAD solver: several reviewed dimensions/relationships are asserted, and changing them may require source/layout/test changes. Geometry is batched by material/zone for browser loading; the source component manifest retains semantic names/bounds. It is not a full DCC modeling history, optimized instancing system, manifold architectural solid, detailed interior or construction drawing.

### Actual exports and checks

[Build evidence](evidence/a1-runtime/landmark-study.json) records source configuration hash, every source component, deterministic-repeat hashes and exact generated GLB bytes.

| Result                                                | Measured outcome                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Source components / render batches / scalar materials | 1,060 / 27 / 9                                                                           |
| Triangles                                             | 17,588                                                                                   |
| Original GLB                                          | 1,359,360 bytes                                                                          |
| Meshopt GLB                                           | 194,156 bytes (~85.7% smaller in this fixture)                                           |
| Repeat original generation                            | Identical SHA-256 within the pinned toolchain                                            |
| Original glTF validator                               | 0 errors, 0 warnings; 27 infos                                                           |
| Meshopt glTF validator                                | 0 errors, 0 warnings; 2 infos                                                            |
| Babylon 9.38.0 WebGL2 load                            | Both originals/compressed loaded; mesh/triangle/material/skeleton/animation counts agree |
| Import/remove/dispose                                 | Three cycles; mesh/material/texture counts return to baseline                            |
| Whole scene disposal                                  | Scene disposed, engine scene count 0                                                     |
| Page errors / failed requests / external requests     | 0 / 0 / 0                                                                                |

Validator evidence: [original](evidence/a1-runtime/landmark-validation.json), [meshopt](evidence/a1-runtime/landmark-meshopt-validation.json). The meshopt extension still has the validator's documented limited inspection; Babylon's actual decode/load is complementary proof, not a replacement for production review. Pinned isolated SDK versions are inherited from the previous pass; no root dependency or lockfile changes.

The first browser bound assertions exposed the intended 7.5 mm outer slab-joint inset and ~1.06 mm compressed top-bound drift; assertions now distinguish nominal site bounds from visible slab edges and use a documented 2 mm envelope tolerance for height. **Count/envelope agreement does not prove per-vertex or pixel identity** after lossy quantization. No collision geometry is exported or implemented; collision metadata is planning only.

### Browser images and visual observations

[Browser evidence](evidence/a1-runtime/landmark-browser.json). Chromium 158 / explicit SwiftShader / WebGL2, not Windows, WebGPU, physical-GPU performance or HP Victus evidence. No FPS/VRAM claim. Shadow map 2048, procedural hemispheric/directional daylight, ACES tone mapping; no external environment map or textures. Geometry export and presentation are separate; lighting is viewer setup, not baked into GLB.

- [Front / plaza](evidence/a1-runtime/landmark-front.png)
- [Rear / roof](evidence/a1-runtime/landmark-rear.png)
- [Whole site](evidence/a1-runtime/landmark-site.png)

The initial camera preset implementation reset its angles while changing the target; image review caught that rear view resembled front. Fixed target-before-angle ordering, regenerated all images, and added front/rear camera-position assertions. Screenshots are actual browser output, not concept/AI renders. Front and rear images were opened and inspected; the rear now visibly exposes the side, service façade and complete roof.

**Visual assessment:** curved silhouette, repeated floor/bay rhythm, blue entry cue and site connection are legible. The result is visibly a construction study: dark opaque glazing, scalar surfaces, simple roof/service detail, empty planters, no surroundings or hero and no fine weathering/reflection response. Repetitive rear bays and sparse entry detailing do not meet the primary concept's premium composition. This pass demonstrates whole-envelope construction/export, **not close-concept final art or owner visual acceptance**. No downgrade to this appearance is assumed.

## 5. ₹0 workflow disposition and remaining gates

| Workstream      | Decision / next concrete gate                                                                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmark/plaza  | Retain parameterized original geometry as construction source; refine silhouette/entry from the concept, then specialist bevels, junctions, roof/side treatments, UVs/trim materials and detail. Do not integrate this scalar study as finished landmark |
| Character       | Retain MPFB/core CC0 plus original face/hair/outfit. Execute the portable recipe in supported Blender, validate/deform actual exports, then construct the fixed concept male hero and required locomotion. No generic synthetic rig substitute           |
| Vegetation      | Previously researched CC0 tree/shrub binaries still unacquired/uninspected. Resolve package access on supported network or author original production vegetation; real flowering accent remains open. Empty sockets are not coverage                     |
| PBR/daylight    | Scalar material/shadow pipeline exercised, not real texture rights/resolution/UV/normal/roughness verification. Acquire/inspect appropriate CC0 material files or author originals. No paid HDRI, AI service or KTX2 success assumed                     |
| AI/tools/rights | No AI service/upload used in this pass. No new entitlement discovered. MPFB code GPL vs core assets CC0 remains the prior source audit conclusion; this study does not grant third-party/trademark rights                                                |
| Optimization    | Retain original and meshopt exports separately; measure visual quantization and actual PC workload later. 27 batches is a study result, not a fixed draw-call/frame-time guarantee or approved device tier                                               |
| G1              | Still prohibited until A1 asset/export/animation/visual/performance acceptance genuinely satisfied                                                                                                                                                       |

**Next practical sequence:** supported Blender runtime → actual MPFB all/four exports and browser deformation → fixed hero resources/locomotion; independently refine the original architecture and inspect real PBR/vegetation → cohesive browser composition → measured target-PC validation and explicit A1 acceptance. No paid shortcut or unrelated city/NPC work.

## 6. Reproduce this pass

Requires the previous pass's isolated SDK install and pinned MPFB source. Generated GLBs and viewer bundle stay in ignored cache; source, JSON results and screenshots persist in the repository. No application bootstrap changes are needed.

```sh
# This command is expected to FAIL in the current runtime; use a scratch report.
PYTHONPYCACHEPREFIX=.cache/a1-runtime/pycache PYTHONPATH=.cache/a1/python \
  python scripts/a1/mpfb-export-study.py \
  --source .cache/a1/sources/mpfb2-2.0.18 --output .cache/a1-runtime/mpfb \
  --report .cache/a1-runtime/mpfb-repeat.json

PYTHONPATH=.cache/a1/python python scripts/a1/weight-sensitivity.py \
  --source .cache/a1/sources/mpfb2-2.0.18 \
  --report docs/evidence/a1-runtime/weight-sensitivity.json
node scripts/a1/build-landmark-study.mjs
node scripts/a1/prepare-landmark-viewer.mjs
# Start in a separate process; bind for Arena's browser preview.
python -m http.server 5181 --bind 0.0.0.0 --directory .cache/a1
# With the server running:
node scripts/a1/check-landmark-browser.mjs
```

The isolated viewer route is **`/landmark.html`** on the study server (port 5181); preparation also makes it the live preview's home page. The earlier diagnostic remains at `/study-viewer.html`. Neither is the game. Browser asset/decoder URLs are relative to the serving origin; browser code never calls another localhost service.

### Verification and preservation

| Check executed in this pass                                                          | Result                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python syntax compilation, both new scripts                                          | Pass; bytecode redirected to ignored cache                                                                                                                                                                     |
| Source-weight study                                                                  | Pass; scope limitations above remain                                                                                                                                                                           |
| Full exterior generation / deterministic repeat / two validators                     | Pass; both reports 0 errors, 0 warnings                                                                                                                                                                        |
| Isolated Babylon browser checks and three screenshots                                | Pass; explicit software WebGL2, not hardware acceptance                                                                                                                                                        |
| ESLint / TypeScript / unit tests / production build                                  | Pass / pass / 21 passed / pass; existing >500 kB build-chunk advisory remains                                                                                                                                  |
| Foundation E2E                                                                       | First default invocation could not launch: Playwright's standard browser executable absent. Re-run using cached Chromium, browser libraries and explicit SwiftShader: **8 passed**; actual Auto backend WebGL2 |
| Whole-repository format check                                                        | Fails only on unchanged `docs/master-game-plan.md` and `docs/milestones.md`; no historical reformat to hide this. Consequently the format-first aggregate check is not claimed green                           |
| Targeted formatting / relative report links / diff whitespace / evidence consistency | Pass                                                                                                                                                                                                           |
| Preservation against follow-up-start 56-file SHA-256 inventory                       | 55 unchanged; only earlier inspection report changed, by the explicit follow-up cross-link. App, package/lockfile, roadmap, approvals and earlier evidence unchanged                                           |

Nineteen new files are confined to this follow-up report, `scripts/a1/` sources and `docs/evidence/a1-runtime/`. Large source packages, GLBs, bundles and transient logs stay ignored. No commit/push, paid operation, source asset deletion or game implementation changes.
