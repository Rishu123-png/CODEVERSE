# A1 inspection tools — isolated, not game runtime

These are reproducible **technical studies**, not production city/character assets. See [the inspection report](../../docs/a1-source-tool-inspection.md) before interpreting their output.

## Isolation and rights

- Run commands from the repository root. Application source and root dependency manifests are not modified.
- Large source packages, binaries, tool installs, generated GLBs, bundler output and temporary logs belong in ignored `.cache/a1/`, not Git.
- The SDK toolchain is pinned by `toolchain-package.json` and `toolchain-package-lock.json`. Their names deliberately differ from the application's manifests. Copy them into the isolated install directory as shown below.
- Source audit uses official MPFB **v2.0.18**. Code is GPL-3.0-or-later; bundled graphics data CC0 1.0. The audit reads files and does not import/execute MPFB.
- No third-party asset mesh, MPFB code or proprietary reference imagery is embedded in the original diagnostic fixtures. The foliage PNG and two-joint skin are synthetic tests, not botanical/hero content.
- meshoptimizer's local decoder carries its MIT header; installed packages/native dependencies retain their own notices. These cache tools are not shipped with the game.
- No account, purchase, paid AI service, Unity/Unreal project or global installation is required for these diagnostics.

## 1. Restore isolated tools

Node 22 was used. On an authorized machine with registry access:

```bash
mkdir -p .cache/a1/tools .cache/a1/sources .cache/a1/results
cp scripts/a1/toolchain-package.json .cache/a1/tools/package.json
cp scripts/a1/toolchain-package-lock.json .cache/a1/tools/package-lock.json
npm ci --prefix .cache/a1/tools
npm audit --prefix .cache/a1/tools
```

No glTF-Transform CLI is required for the scripts. It was removed after a CLI transitive-dependency advisory finding; the pinned SDK-only tree reported zero known vulnerabilities at inspection time. Never substitute `npm audit fix --force` for review.

## 2. Acquire/audit official MPFB source

```bash
curl --fail --location \
  https://codeload.github.com/makehumancommunity/mpfb2/zip/refs/tags/v2.0.18 \
  -o .cache/a1/sources/mpfb2-v2.0.18.zip
sha256sum .cache/a1/sources/mpfb2-v2.0.18.zip
```

Expected archive SHA-256 from this run:

```text
ada7c4ff11e79cf6ed9b441bccabc52c9359f2848b988f66e89c14c30b21fed7
```

Verify before extraction. Extract the official archive to `.cache/a1/sources/`, then:

```bash
python scripts/a1/audit-mpfb.py \
  .cache/a1/sources/mpfb2-2.0.18 \
  docs/evidence/a1/mpfb-source-audit.json
```

The audit checks parent references and weight ranges/coverage and reports helper/body counts and influence counts. It does not certify rest/bind pose, anatomical quality, deformation, generator output or a legal review of unacquired packs.

### Blender attempt (optional; blocked in this sandbox)

```bash
python -m pip install --target .cache/a1/python bpy==4.5.3
PYTHONPATH=.cache/a1/python python -c 'import bpy; print(bpy.app.version_string)'
```

The wheel installed here, but `import bpy` failed on missing Linux shared libraries. **No Blender/MPFB execution is needed or claimed for the SDK studies below.** A compatible numerical version is not proof of a working Blender installation. Do not fake libraries or use unofficial binary mirrors. See the report for all missing libraries and binary-host restrictions.

## 3. Generate/validate/optimize diagnostic fixtures

```bash
node scripts/a1/run-studies.mjs
```

Produces editable-by-script original fixtures in `.cache/a1/generated/` and JSON evidence in `docs/evidence/a1/`. Assertions cover deterministic original regeneration, original/compressed validation errors and warnings, decoder round-trip scene/skin/animation counts, analytic curvature/slope checks and rejection of invalid input. The selected validator does not fully validate the meshopt extension, so SDK/browser decoding is additional required evidence.

No Blender export, original asset-package conversion, real hero, retargeted locomotion, gameplay collision, glass transmission, real vegetation, wind, shadow-quality or performance proof is generated.

The larger curved fixture shrinks under compression; the tiny foliage/skin fixtures grow. Do not optimize every asset blindly or interpret these small byte counts as city budgets.

## 4. Bundle/serve/test the browser laboratory

```bash
node scripts/a1/prepare-viewer.mjs
python -m http.server 5181 --bind 0.0.0.0 --directory .cache/a1
```

Run the server in a separate terminal (or Arena's background-process tool). The browser-facing code uses same-origin relative paths, not sandbox `localhost` API calls. This local server is for a controlled diagnostic session, not a production deployment; stop it when finished.

With an existing Playwright install and a working Chromium executable:

```bash
# In this sandbox the cached Chromium executable is the default.
# Else point PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH at an authorized Chromium.
node scripts/a1/check-browser.mjs
```

The test runner itself connects to the local server; the user's browser is not expected to access its own localhost. It forces software WebGL2 for this diagnostic, blocks external browser requests and captures:

- Three compressed fixtures and structural comparisons to originals.
- Alpha material import and an actual changing imported joint transform.
- Three add/remove/dispose cycles returning scene-object counts to baseline.
- Missing-file loader rejection and final scene/engine disposal.
- Actual screenshot and JSON evidence, explicitly labeled **SwiftShader, not physical GPU**.

No measured FPS, long-session memory, WebGPU, Windows or owner-hardware result follows. The screenshot must never be labeled a finished CodeVerse landmark or accepted G1 art.

## 5. Formatting/checks

```bash
node_modules/.bin/prettier --write \
  scripts/a1/*.mjs scripts/a1/*.html scripts/a1/*.json \
  docs/evidence/a1/*.json
node_modules/.bin/eslint scripts/a1/*.mjs
PYTHONPYCACHEPREFIX=.cache/a1/pycache python -m py_compile scripts/a1/audit-mpfb.py
```

Re-running the scripts overwrites their own JSON evidence/generated cache, not acquired originals. Evidence should be reviewed and committed only with accurate report updates. Source/tool availability may change; exact version/hash/license and actual results must remain separate from assumptions.
