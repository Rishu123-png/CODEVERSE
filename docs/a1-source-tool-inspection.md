# CodeVerse — A1 source/tool inspection and production-path studies

> **Current consolidated status:** [A1 final readiness report](a1-final-readiness-report.md) includes subsequent vegetation/animation source checks, the current licensing caveat, visual gap review and hardware risks. Results below remain historical. A1 remains open; G1 requires explicit approval.

Date: 2026-11-27  
Status: **bounded inspection/study completed; A1 remains open; G1 not started or accepted**.  
Baseline: [Master Game Plan](master-game-plan.md) · [A1 proposal](a1-asset-readiness-proposal.md)

> **Subsequent pass:** [runtime blocker and full exterior/plaza study](a1-runtime-landmark-follow-up.md) records a further actual failed MPFB execution, bounded runtime alternatives, mathematical weight sensitivity, and a whole-building GLB/browser study. This document's results remain the earlier historical pass; neither pass closes A1.

## 1. Outcome, not just a plan

This pass acquired and inspected official MPFB source, installed isolated tooling, audited actual mesh/rig data, authored reproducible technical fixtures, generated and optimized GLBs, validated them, and loaded them in an isolated Babylon.js browser laboratory. It also attempted Blender execution, source-host access and KTX2 encoding, and recorded the failures.

**What is now demonstrated:** a narrowly tested original procedural geometry → glTF-Transform GLB → meshopt/quantization → locally decoded Babylon.js 9.38.0 WebGL2 path for three diagnostic fixtures. Regeneration, selected material/animation properties, structural comparisons, missing-file failure and short load/dispose cycles were checked.

**What is not demonstrated:** Blender/MPFB execution and export; finished landmark/plaza/hero/vegetation quality; source tree/material package quality; real locomotion retargeting; production memory/performance; WebGPU; Windows; owner-hardware suitability. Synthetic test objects are not approved game assets and do not replace the visual target.

### Evidence index

- [MPFB source audit](evidence/a1/mpfb-source-audit.json): source-file hashes, manifest, topology/helper counts, rig and weight checks.
- [Tool/environment inspection](evidence/a1/tool-inspection.json): installed versions/licenses, source archive hash, failed tool/network probes and dependency-audit remediation.
- [Technical fixture results](evidence/a1/technical-studies.json): exact sizes/hashes, regeneration checks, measurements and optimization results.
- Validator reports: [architecture](evidence/a1/architecture-validation.json), [foliage](evidence/a1/foliage-validation.json), [skin](evidence/a1/skin-validation.json); compressed variants: [architecture](evidence/a1/architecture-meshopt-validation.json), [foliage](evidence/a1/foliage-meshopt-validation.json), [skin](evidence/a1/skin-meshopt-validation.json).
- [Browser test report](evidence/a1/browser-study.json) and [actual diagnostic screenshot](evidence/a1/browser-technical-study.png).
- [Reproduction scripts and instructions](../scripts/a1/README.md). Large packages, generated GLBs and temporary logs are under ignored `.cache/a1/`, not committed as game content.

## 2. Actual source and tool inspection

### Acquired source

Official repository/tag: [makehumancommunity/mpfb2, v2.0.18](https://github.com/makehumancommunity/mpfb2/tree/v2.0.18). Downloaded through the official GitHub codeload tag URL, not an unofficial asset mirror. The archive contains **3,114 ZIP entries**; this includes directories and is not a count of assets. Archive SHA-256:

```text
ada7c4ff11e79cf6ed9b441bccabc52c9359f2848b988f66e89c14c30b21fed7
```

Inspected `LICENSE.md`, code/asset license files, `src/mpfb/blender_manifest.toml`, bundled `base.obj`, game-engine rig/weights JSON, HumanService source, mesh metadata and the official scripting/export examples. No source code from MPFB was copied into the game or modified. Our audit script reads data; it does not execute the generator.

**Verified in acquired files:**

- Extension **2.0.18**, maintainer **Joel Palmius**, minimum Blender **4.2.0**. This replaces the prior proposal's unknown minimum-version field.
- Program logic **GPL-3.0-or-later**; bundled graphics data **CC0 1.0 Universal**. The license expressly discusses scripting output as asset/creative output, not program logic. This does not clear arbitrary community packs.
- `base.obj` has an explicit CC0 notice and credits Data Collection AB, Joel Palmius and Jonas Hauquier at the 2020 release. Exact chosen core textures/eyes/clothing are not covered by this inspection because the separate system pack was not acquired.
- MPFB's `create_human` default `scale=0.1` and feet-on-ground behavior were read in source. Raw OBJ coordinates must not be treated directly as runtime meters or assumed to be in the final Blender/glTF orientation.
- The complete-character example requires separately installed system assets and stages an export duplicate, helper removal and game-engine materials before FBX export. It is **not a working CodeVerse GLB example**.

### Installed isolated tools

No root `package.json`, root lockfile, application source, renderer policy or existing tests were edited.

| Tool                                     | Actual installed version / license evidence                                         | Result                                                                                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blender Python API (`bpy`)               | **4.5.3**, official PyPI distribution, Blender GPL tool route                       | Wheel installed successfully in `.cache/a1/python`; **import failed**, so no Blender operation/export ran.                                           |
| MPFB                                     | **2.0.18** source/tag; GPL-3.0-or-later code, CC0 bundled graphics                  | Source inspected, not registered or executed in Blender. Manifest minimum 4.2 is met numerically by 4.5.3, but actual compatibility is **untested**. |
| Babylon core + loaders                   | **9.38.0 / 9.38.0**, Apache-2.0 package metadata                                    | Installed in isolated tools only; browser import/render test passed. Existing application still does not declare loaders.                            |
| glTF-Transform core/extensions/functions | **4.5.1**, MIT, Don McCurdy                                                         | Actual fixture generation, parsing, dedup/weld/prune and meshopt transforms executed.                                                                |
| Khronos glTF Validator                   | **2.0.0-dev.3.10**, Apache-2.0, Khronos                                             | Six reports generated; exact pinned prerelease identifier retained, not described as a newer stable version.                                         |
| meshoptimizer                            | **1.2.0**, MIT, Arseny Kapoulkine                                                   | Encoder/decoder executed; browser decoder served locally with its license header intact.                                                             |
| sharp                                    | **0.35.5**, Apache-2.0 package metadata; native dependencies have their own notices | Generated one original 128×128 diagnostic PNG. Not a cleared botanical texture library.                                                              |
| esbuild                                  | **0.28.2**, MIT                                                                     | Bundled the isolated browser harness after raw ES-module serving proved impractical.                                                                 |
| KTX tools                                | No working `ktx` executable                                                         | Encoding attempt failed; no KTX2 asset produced or loaded.                                                                                           |

**Blender blocker:** importing `bpy` failed with `ImportError: libXrender.so.1: cannot open shared object file`. `ldd` also reports missing `libXfixes.so.3`, `libXi.so.6`, `libxkbcommon.so.0`, `libSM.so.6`, `libICE.so.6` and `libGL.so.1`. Installing a wheel is not a working Blender installation. We did not fake library symbols, alter system graphics libraries or claim a successful headless build. The source/API alternatives below provide limited evidence, not a substitute for that test.

**Dependency hygiene:** the initially installed glTF-Transform CLI worked for `inspect` but `npm audit` reported four moderate advisory entries in its CLI/glob/caporal/minimatch chain (not four independently proven exploits). Removed the CLI and pinned only needed SDK packages directly. Final isolated-tool audit reports **0 known vulnerabilities** at this registry snapshot. This is not a security guarantee; native dependencies/notices and future advisories still need review. No `audit fix --force` or application downgrade was performed. Initial/final counts are preserved in tool evidence.

## 3. Landmark, plaza and prop production-path study

### Working production brief adopted for the next study

These are **agent-selected design defaults**, not measurements inferred from one concept perspective, final art acceptance or a demand for another owner questionnaire:

- One original complete exterior, approximately **32 m frontage, 24 m depth, 25 m height**. Begin with an approximately 22 m-radius curved frontage and solve its angle/end transitions against this frontage. Six-level visual rhythm, taller layered ground/entry zone; exact band/level heights must reconcile to the overall height in the editable master.
- Original curved glazing bays with repeated mullions, projecting bands and visible undersides; recessed entrance/canopy/columns; credible side/rear/service/roof terminations. Concept identity and coherent full volume take priority over these initial dimensions if a documented proportion study requires adjustment.
- One compact roughly **42 × 36 m** site including the landmark approach/plaza footprint, with intentional camera boundaries; a short roughly **12 m** pedestrian connection to a bounded road strip, not a road network. The site layout must reconcile the building's footprint, route and planting rather than independently filling these rectangles.
- Civic-furniture family: bench seat around **0.45 m** high, coherent planter coping/seat relationship, restrained lights/signage and believable mounting details. Original fixtures can share material families and modules, but may not remain crude boxes at final acceptance.
- Meter-scale workflow and documented pivots; fixed 1.8 m nominal character reference. Begin a 1080p inspection-camera sheet with a 55° vertical FOV candidate, near/mid/far and front/side/rear viewpoints. Camera settings are study defaults, not accepted performance/visual criteria.
- Model changes in grade only where necessary. A 0.15 m rise over 1.8 m run is a useful **1:12 slope test**, not certification of an accessible design; landings, clear width, railings, crossfall and local standards are not established by slope alone.

The full exterior, original graphics and site construction remain required. A cylinder, flat facade, image background or screenshot-to-3D model is not an acceptable shortcut.

### What was actually made/tested

The original script constructs **only a small 60° curved junction**, radius 8 m, upper/lower band surfaces, mullions, recessed entry/canopy/blue trim, slab/curb/ramp and bench dimensional fixture. It is deliberately not the complete landmark, a plausible finished plaza, detailed furniture or an artistic proof. Opaque reflective glazing tests PBR parameters; glass transmission, city reflections and interior depth are not tested.

- Fine study: **48 arc segments**, maximum analytic chord/sagitta deviation **0.476 mm**.
- Coarse LOD study: **12 segments**, deviation **7.614 mm**. This quantifies a geometric difference; it does **not** determine screen-space LOD distances or prove an acceptable silhouette/highlight transition.
- Ramp rise/run assertion passes at 1:12.
- Collision-only naming/extras are carried as a diagnostic. The fixture collider is moved below the display and explicitly disabled in the viewer. This exposed why collider geometry must be extracted/omitted from render exports: it can still distort aggregate bounds and inflate geometry counts. No gameplay collision system was implemented or tested.
- Editable original source is the parameterized script, not a fabricated `.blend`. A Blender artist-facing master/export path remains to prove.

**Disposition:** accept this narrow procedural geometry/export route for further A1 studies. **Hold production architecture/plaza/props** until a complete concept-aligned editable study, material/UV/normal treatment, side/rear views and actual construction details exist. The simple test image must never be passed off as the approved visual result.

## 4. Player creation: actual data findings and limits

### Source measurements

| Check                                      | Actual result                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Raw base OBJ                               | **19,158 vertices, 18,486 faces**, including helper/joint geometry                                |
| Body group only                            | **13,378 faces**, **13,380 referenced vertices**, **26,756 triangles** by fan-triangulation count |
| Game-engine rig JSON                       | **53 bone definitions**, all parent references resolve                                            |
| Weight references/values                   | All referenced indices within OBJ range; values in [0,1]                                          |
| Body weight coverage                       | **0** body vertices without positive weights                                                      |
| Maximum positive influences on body vertex | **6**                                                                                             |
| Body vertices with more than 4 influences  | **608**                                                                                           |
| Largest body weight-sum deviation from 1   | Approximately **0.000100021**                                                                     |

Fan triangulation is a topology count, not an exported/measured render mesh. UV seams, modifiers, subdivision, clothing, skinning attributes and exporter choices change runtime vertices/triangles. Helper-tights alone contributes **2,650 faces**; source helpers must not ship as body/clothing merely because they are present. The audit includes full group counts and raw coordinate bounds.

**New actionable constraint:** do not silently truncate all skin weights to four. Inspect the exporter's actual behavior and compare deformation using all required glTF influence sets versus an explicitly normalized four-influence variant. Six influences may be supported by a chosen path, but acceptable bend quality and actual shader cost are unproven. Even the small weight-sum drift needs an explicit normalization/check policy rather than assuming pristine weights.

### Recommended creation/export workflow

Use the pinned MPFB source/core starting route, not Human Generator or a paid service. Once Blender is runnable: generate one fixed body with recorded settings, refine the original identity/proportions/face/hands, install individually cleared eyes/skin/proxies as needed, and author the concept hair/outfit/shoes originally. Select a canonical rest pose/root/deform rig; keep control rig/helpers out of the runtime export duplicate. Fit and weight the fixed outfit before adding broad shapes.

Test shoulders/elbows/wrists, hips/crotch/knees/ankles, shoe contact and jacket/trouser clearances. Retarget only cleared actual idle/walk/run clips after pose/name/root/scale mapping; bake offline and compare to the original. Export via the actual Blender glTF path, validate/reimport, then load in Babylon. Keep generator settings/editable masters distinct from runtime variants.

**What our animation test proves:** a synthetic 10-vertex strip, two joints and a one-second original bend clip survive our GLB optimization/import path. Babylon's imported `diagnostic-tip` quaternion changes from identity to approximately `[0,0,0.382672,0.923887]` at the midpoint. It does **not** demonstrate MPFB binding, humanoid gait, fitting, facial quality, locomotion transitions or retargeting from Quaternius.

**Disposition:** retain MPFB as a conditional source path, with stronger topology/rights evidence. **Hold finished hero and retargeting readiness.** No final body, skin, face, hair, garment, footwear or motion selection was made in this pass.

## 5. Vegetation, props and materials: accessible evidence versus missing packages

Direct binary/source access to the proposed non-GitHub hosts failed in this sandbox (`curl` exit 35, TLS connection failure). This is consistent with the environment's outbound-host restriction, not proof that the publisher's service is generally down. The public-page research tool can retrieve page/API text; it does not provide a verified binary package to our filesystem.

### Newly inspected publisher API manifests

- [Poly Haven Jacaranda file manifest](https://api.polyhaven.com/files/jacaranda_tree): retrieved manifest text lists the **1K Blend file at 180,228,496 bytes** plus **10 included texture files**, together **32,949,799 additional bytes** in that selected entry. This is approximately **203.3 MiB total** for those listed files, not the browser payload. Listed dependencies span branch/trunk/leaf maps. Hashes in this API are publisher MD5 values, not our acquired-file SHA-256 checks. The `.blend` and textures were **not downloaded or parsed**.
- [Poly Haven Shrub 02 file manifest](https://api.polyhaven.com/files/shrub_02): retrieved entry lists the **1K Blend file at 1,094,180 bytes**, plus roughness EXR, alpha PNG, diffuse JPG, mask PNG and GL-normal EXR (**1,853,133 additional bytes**). It also lists a 4K glTF entry of **8,083 bytes**, binary buffer **758,692 bytes**, and ARM/diffuse/normal dependencies. That is file-manifest evidence, not proof those are the complete effective material dependencies or useful runtime LODs. The JSON/mesh/textures were **not downloaded**.

These manifests improve dependency planning beyond a catalogue format tag. They do not resolve visual fit, actual LOD structures, alpha-map wiring, Geometry Nodes baking, compression artifacts or runtime cost. The proposal's **312K-triangle Jacaranda / 52K-triangle shrub** figures remain publisher page claims, not independent counts.

### Material and planting dispositions

| Item                            | Evidence/state this pass                                                            | Decision                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jacaranda shade-tree candidate  | Official file manifest text and prior page/spec review only                         | Retain on hold; no source optimization or flowering variant claim.                                                                                    |
| Shrub 02                        | Official file/dependency manifest text; binary download blocked                     | Retain on hold; actual alpha/LOD/source quality untested.                                                                                             |
| Flowering accent                | No acquired ready-made source                                                       | Keep essential and unresolved; original branch/card/flower-atlas study required. Do not recolor green leaves and call it a proven flowering solution. |
| Road012A / Concrete034          | Prior exact asset/license page review; direct ambientCG source access blocked       | No package/map/tiling/color-space inspection claimed. Keep candidates conditional, original material path available.                                  |
| Pale plaza paving               | Original slab/joint/material family brief, fixture uses only scalar color/roughness | No final PBR paving selected or authored. Mossy PavingStones036 remains rejected for the primary finish.                                              |
| Bench/light/planter/sign family | Original brief; one dimensional bench fixture only                                  | No library needed; final original geometry/material craft remains. No optional utility-box download.                                                  |

**Alpha material test actually executed:** original generated **128×128 PNG**, two crossed quads, glTF `MASK`, cutoff 0.5, double-sided. Babylon loaded the embedded texture and preserved cutoff 0.5, alpha-test mode, `backFaceCulling=false` and `hasAlpha=true`. The screenshot shows the diagnostic cutout rather than an opaque rectangle. This is not a foliage overdraw, shadow, mip-fringe, botanical silhouette or wind-quality test; no tree was made.

**KTX2 test actually attempted:** glTF-Transform CLI 4.5.1 `uastc` on this fixture failed with exit 1 because it could not locate **`ktx`**. This version checks `ktx`, not just the older proposal's `toktx` name. No compressed texture, GPU transcode, KTX2 material comparison or browser KTX2 compatibility result exists. Keep the existing PNG source and resolve the exact KTX-Software distribution/license/dependencies before that test.

## 6. Optimization, export and Babylon compatibility results

### Actual fixture results

| Original diagnostic        | Original GLB                                        | meshopt GLB  | Original / compressed validator errors, warnings | Meaning                                                                               |
| -------------------------- | --------------------------------------------------- | ------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Curved junction/plaza/prop | **75,028 B**, 834 triangles, 20 meshes, 4 materials | **21,764 B** | **0/0 and 0/0**                                  | ~71% smaller for this fixture only; not a production building budget.                 |
| Alpha foliage material     | **3,760 B**, 4 triangles, 1 material                | **4,656 B**  | **0/0 and 0/0**                                  | Compression **increased** size ~24%; do not apply automatically to tiny assets.       |
| Two-joint skin/clip        | **3,040 B**, 8 triangles, 1 material                | **4,328 B**  | **0/0 and 0/0**                                  | Compression **increased** size ~42%; validates a diagnostic route, not a hero budget. |

Generated by glTF-Transform, **not Blender**. The optimization sequence was dedup → weld → prune → meshopt(high), with meshopt/quantization effects, not lossless identity in all numeric attributes. Compressed exports require **EXT_meshopt_compression** and **KHR_mesh_quantization**. The exact SHA-256 values and installed versions are in evidence. Original fixtures regenerated twice with identical hashes. Optimized hashes are recorded, but byte-identical optimized regeneration was not separately asserted.

**Validator message review:** original architecture has 20 informational unused-UV messages, synthetic skin one, foliage none. Compressed reports also include informational extension/unused-data messages; these are not zero-message reports. The validator identifies meshopt as an unsupported validation extension, so a zero-error report is **not full validation of its compressed payload**. Actual SDK decoding and Babylon loading are additional evidence, not a reason to hide the validator's limit. An intentionally invalid four-byte input was rejected, proving the test does not accept arbitrary bytes.

### Browser execution

Linux Chromium **158.0.8127.0**, Babylon core/loader **9.38.0**, **WebGL2 on ANGLE SwiftShader**. Forced WebGL2 check fails if WebGL2 is unavailable; no silent backend substitution. This isolated harness is outside the application and does not change the game's lifecycle/backend code.

Verified:

1. All three compressed assets load/render with a **self-hosted decoder**; intercepted browser requests include **zero external network requests**, zero page errors and zero failed network requests. The intentionally missing asset returns HTTP 404 and rejects its loader promise; HTTP error responses are not counted as Playwright transport failures.
2. Compressed versus original imports agree on triangle totals, skeleton counts and animation-group counts. This is a structural comparison, **not a vertex-by-vertex quantization-error or pixel-diff proof**.
3. The alpha material properties above survive import; the imported synthetic bone transform changes with the animation.
4. Three extra skin-container add/remove/dispose cycles each return to the recorded baseline: **25 scene meshes, 6 materials, 3 textures, 1 skeleton, 1 animation group, 3 transform nodes**. Full scene disposal reports `sceneDisposed=true`; engine scene count returns to zero. These short scene-object checks do not prove browser/GPU heap reclamation, async cancellation safety or long-session memory stability.
5. An actual screenshot was captured and reviewed. It visibly contains a basic construction fixture, flat lighting and simple diagnostic shapes. It is **not** a premium-art sample or visual acceptance evidence for the game.

**Problems encountered/fixed:** initial raw browser ES-module loading did not reach readiness within the test timeout. The harness was bundled locally with esbuild; the rerun passed. Initial synthetic skin validation exposed non-zero joint indices paired with zero weights; the generator was corrected, then all validation and browser tests rerun. Neither fix involved the game or MPFB source. These failures and final results must not be presented as a first-attempt flawless pipeline.

**Unrun:** WebGPU, physical GPU/Windows/owner HP Victus, native-1080p workload benchmark, FPS/frame pacing, real texture residency, transmission/reflections/shadows, real source foliage, humanoid deformation/retarget, gameplay collisions, unload cancellation/context-loss and production visual quality. No FPS claim is made.

## 7. Rights, free tools and AI-assisted workflow decisions

### Rights now verified versus still page-level

| Resource                                        | Creator/publisher and rights evidence                                                                                                                                                  | Browser/output consequence / remaining limit                                                                                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MPFB v2.0.18 code                               | MakeHuman Community / maintainer Joel Palmius; acquired manifest and license files: GPL-3.0-or-later                                                                                   | Used only as inspected offline tooling source, not browser runtime. Code license is not a CC0 software license.                                                                                                         |
| Bundled base/rig/weights/data                   | Acquired asset license: CC0 1.0 Universal; base OBJ has explicit author/rights notice; weight JSON marks CC0                                                                           | Commercial modification and potentially extractable browser asset delivery are compatible with CC0 for these confirmed files. Individual core textures/eyes/garments not acquired; no blanket clearance of other packs. |
| MakeHuman system pack                           | Official page and prior CC0/item-table review only; archive access blocked                                                                                                             | Exact chosen items/dependencies/hashes and package license notices remain unresolved. No claim it is installed.                                                                                                         |
| Quaternius Universal Animation Library Standard | Publisher Quaternius, assistance credited to Gonzalo Furnier; [official tier page](https://quaternius.itch.io/universal-animation-library) says CC0 1.0 Universal, Standard free/15 MB | Binary access blocked. Exact free idle/walk/run inventory, formats/root variants/editable source still unknown. Full 120+ library and paid Source files not assumed.                                                    |
| Poly Haven Jacaranda / Shrub 02                 | Rico Cilliers; Jacaranda guidance Rob Tuytel; exact pages/manifests; [asset license](https://polyhaven.com/license) CC0 1.0                                                            | Permissive asset rights are page-level; acquired package/source/dependency audit not done. Site renders/copy/logos are not automatically asset CC0.                                                                     |
| ambientCG Road012A / Concrete034                | ambientCG; no individual creator established on retrieved pages; [license](https://docs.ambientcg.com/license/) CC0 1.0 Universal                                                      | Commercial/modified/raw game delivery permitted under stated license, but no actual package/map/source inspection.                                                                                                      |
| Original diagnostic scripts/geometry/PNG        | Authored in this repository for CodeVerse; no third-party game geometry or reference pixels used                                                                                       | Not approved final assets and not newly declared CC0. Repository/project rights apply; preserve contributor provenance.                                                                                                 |
| Isolated software dependencies                  | Exact package versions/licenses captured; pinned tool-only lockfile retained                                                                                                           | MIT/Apache notices and third-party native/decoder notices must be carried if tools/codecs are redistributed. Tool license does not license unrelated art.                                                               |

**Acquisition spending: ₹0.** No purchases, subscriptions, commissions, new service accounts, paid source tiers or proprietary game extraction. No inferred rights over trademarks/likenesses. Compression is not DRM. The owner-supplied reference videos were not uploaded to a new AI service or turned into game textures.

**AI/tool choice:** use the coding agent for the work it can verify: original procedural studies, data audits, versioned export automation and test execution. This pass used no image/3D-generation service because a generated render would not answer the rig/export/dependency blockers. Do not invent access to a fleet of specialized models or claim AI finishing can meet the character target without evidence. Paid Human Generator remains excluded. MPFB's source includes scripting facilities, but adding MCP/server access would expand dependencies/security surface without solving a demonstrated need here, so no such service was installed.

## 8. Decisions and readiness disposition

| Path                                                         | Decision after this pass                                                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original procedural architecture components → glTF → Babylon | **Accept for further A1 technical studies**, not final architecture/art acceptance. Curvature, normals, UV/material craft and full exterior still need work.        |
| Blender 4.5.3 + MPFB 2.0.18 actual generation/export         | **Hold: runtime blocked by missing system libraries**. Manifest compatibility alone is insufficient.                                                                |
| MPFB core source legal/topology basis                        | **Retain conditionally**; explicit core rights and real data now inspected. Influence-count issue becomes a required test.                                          |
| Fixed concept hero + clothes/hair/retarget                   | **Hold**; not demonstrated by the synthetic strip.                                                                                                                  |
| Source vegetation/material packages                          | **Hold: binary access blocked**; manifest research improved dependency knowledge, not package quality.                                                              |
| meshopt/quantization                                         | **Selective use**; proven for fixtures, beneficial for the larger fixture and harmful to tiny ones. Identity/deformation comparisons still required per real asset. |
| KTX2                                                         | **Hold: encoder prerequisite unresolved**; do not add a required texture extension to shipping assets yet.                                                          |
| NPCs/city/vehicles                                           | **Deferred unchanged**; no scope creep from reference videos.                                                                                                       |

Effort remains uncertain: retain the proposal's **640–1,318 skilled person-hour** bounded asset/pipeline estimate as a planning range, not logged time or a whole-game forecast. No artificial AI speed-up factor is justified by these small tests. Reserve future effort for source-access/tool-runtime remediation and the six-influence comparison; re-estimate after the real skinned-character proof. There is no supported estimate of the time needed to change sandbox network capabilities.

## 9. Completion report and next action

### Validation and regression checks

| Check run this pass                             | Result                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MPFB data audit + original fixture assertions   | Passed; source/result hashes preserved.                                                                                                                                                                                                                                                                                   |
| Original and compressed GLB validation          | Six reports, zero errors and zero warnings; informational messages and meshopt-validator limits documented above.                                                                                                                                                                                                         |
| Isolated A1 browser study                       | Passed on Chromium/SwiftShader WebGL2; material, structural, joint-transform, disposal and failure checks recorded.                                                                                                                                                                                                       |
| Python syntax compilation                       | Passed; bytecode kept out of repository deliverables.                                                                                                                                                                                                                                                                     |
| Scoped formatting and local documentation links | Passed.                                                                                                                                                                                                                                                                                                                   |
| Repository lint and TypeScript                  | Passed.                                                                                                                                                                                                                                                                                                                   |
| Repository unit tests                           | **21 passed** across 3 files. These remain foundation tests, not asset-quality proof.                                                                                                                                                                                                                                     |
| Repository production build                     | Passed; Vite still warns about a chunk exceeding 500 kB. No bundle-size optimization was attempted in this asset-inspection task.                                                                                                                                                                                         |
| Existing foundation browser tests               | **8 passed** on Linux Chromium/SwiftShader; automatic backend was WebGL2. Forced-WebGPU failure checks are not successful WebGPU execution evidence.                                                                                                                                                                      |
| Aggregate `npm run check`                       | **Stopped at formatting:** unchanged `docs/master-game-plan.md` and `docs/milestones.md` do not meet the formatter. Their contents match the pre-task hash baseline. Did not reformat historical/source-of-truth documents to hide this result; subsequent lint/types/unit/build checks were run individually and passed. |
| Scope/integrity check                           | Of 36 pre-task files, only the A1 proposal changed (a link/current-record note); the other **35 are hash-identical**. New files are the inspection report, isolated study tooling/lockfile and small evidence.                                                                                                            |

**Completed current task:** source/tool inspection plus all available bounded non-destructive data and export/browser studies described above, with reproducible scripts and persisted evidence. Acquired originals were not edited. No application source, root dependency, master roadmap or historical foundation evidence changed.

**A1 remains open**, chiefly on actual Blender/MPFB generation/export, cleared core appearance resources and locomotion clips, complete original visual studies, flowering-tree source/authoring proof and real foliage/material package inspection. G1 visual, performance and production-pipeline gates remain separately unrun/unaccepted. This report is not requesting a redundant general permission grant.

**Next step under existing authority:** continue the hardest blocked representative path before expanding content:

1. Check for an official, compatible, reachable headless Blender/runtime dependency route within sandbox capabilities. Do not fake system libraries or install arbitrary unofficial binary mirrors. If none is available, report that specific environment requirement and retain the procedural route only for architecture studies.
2. On a working authorized Blender environment, run one fixed MPFB core body through actual rest/bind-pose and **six-influence versus normalized four-influence** export comparison; add individually cleared skin/eyes and one representative garment deformation study before claiming a hero path.
3. Acquire only the previously listed essential source packages through a supported publisher download route or an owner-supplied unmodified archive with original provenance/license. Network access is an environment blocker, not a reason to switch to paid or unverified assets. No need to ask the owner to buy or gather a giant library.
4. In parallel where tooling permits, evolve the landmark/site brief into a complete editable exterior construction study, not a full city; compare front/side/rear proportions to the concept and document curve/LOD/material decisions. Do not promote the current diagnostic fixture to final art.

No owner-only design/budget approval is needed for these routine investigations. If an environment change or supplied archive is genuinely required after the supported routes are exhausted, request that **specific access/input**, not another open-ended permission questionnaire. Actual visual acceptance and physical-hardware testing will still require evidence and owner participation at their gates.
