# CodeVerse

PC-first browser 3D educational/social game in development. **Current build: G1 early playable**, not final premium-art or laptop-performance acceptance. The actual React/TypeScript/Babylon app now contains an original landmark/plaza, planting, a textured Microsoft Rocketbox player with MIT-licensed idle/walk/run clips, third-person movement/camera and a genuine entrance information interaction.

> **Rendering correction:** the reported mostly-black scene was reproduced in production WebGPU and fixed at the first-frame submission boundary. [Before/after screenshots, root cause and console evidence](docs/g1-rendering-fix.md). Reload the production preview to load the rebuilt correction. No feature expansion was added.

> **Latest connected-district revision:** [camera investigation, expansion measurements, latest evidence and limitations](docs/g2-connected-district.md). Eight surrounding parcels and connected streets; persistent single-owner camera. Includes ten current rendered views, retimed motion/route sequences and measured camera-state checks; software-browser test results and remaining art/hardware limits are documented in the report.

> **Previous detailed graphics revision:** [before/after screenshots, honest ratings and remaining defects](docs/g1-detailed-graphics.md). Curved stone/bronze facade with furnished interior depth, licensed textured character, revised planting/camera clearance and offline HDR lighting. No new gameplay systems. [Earlier visual revision](docs/g1-visual-overhaul.md) remains historical; this is not reference-level or AAA art acceptance.

## Run locally

Use Node **22.22.3** and npm **10.9.8** (tested toolchain). Compatible declared range: Node 22.12+ within 22.x. No backend, database, Docker, credentials, account or environment file is required. Runtime assets are already included: no Blender, asset-generator setup or external asset/CDN access is needed to play.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite binds to `0.0.0.0` and permits the Arena HTTPS preview (`*.e2b.app`). Do not expose the development server directly to the public internet.

### Windows production-build check (PowerShell)

These are instructions to run yourself, **not an installation performed on your laptop**. Node/npm must already be available; installing tools is a separate owner decision.

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open `http://localhost:4173` in current Chrome/Edge with hardware acceleration enabled. Keep the terminal open; Ctrl+C stops the server. Test `/`, `/?renderer=webgl2`, and (if supported) `/?renderer=webgpu`. For the live Arena preview, use its HTTPS URL rather than your laptop's localhost. See [G1 handoff](docs/g1-playable-handoff.md) for controls, checks and limitations.

### Controls

- **WASD / arrows:** camera-relative movement; **Shift:** run.
- **Mouse drag:** orbit; **wheel:** zoom.
- **E:** open/close location information when close to the blue entrance marker.
- **Escape:** dismiss information or pause/resume; **R:** reset player/camera.
- Losing window focus pauses movement; use Continue to resume.

### Renderer modes

| URL                      | Behavior                                                                     |
| ------------------------ | ---------------------------------------------------------------------------- |
| `/` or `/?renderer=auto` | Prefer WebGPU; WebGL2 only after support/init failure, with reason displayed |
| `/?renderer=webgpu`      | WebGPU only; visible failure, never silently switches                        |
| `/?renderer=webgl2`      | WebGL2 only; never silently uses WebGL1                                      |

WebGPU requires HTTPS or localhost, an available adapter and compatible browser/driver. Invalid choices fail visibly. The UI shows actual backend/loading/error state. A failed world asset load is an error, not a ready empty scene or a reason to silently switch backend.

## Quality commands

```sh
npm run check
# Browser setup only on an authorized development machine:
npx playwright install --with-deps chromium
npm run test:e2e
```

`check` runs formatting, lint, TypeScript, unit tests and production build. Browser tests are separate. `npm run test:watch` watches unit tests. `npm run format` applies formatting. `npm run preview` serves an existing production build.

For CI without a GPU, set `PLAYWRIGHT_SOFTWARE_RENDERING=1` for software smoke tests (**not performance proof**). `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects an existing compatible Chromium. Normal runs use Playwright's managed browser. The browser suite includes real keyboard traversal, wall/boundary collision, ramp grounding, entrance information, pause/reset, renderer policy, resize/restart and context-loss checks.

## Implementation and evidence

- [G1 early-playable handoff, known limitations and evidence](docs/g1-playable-handoff.md)
- [Runtime asset notices](public/assets/README.md)
- [Optional authoring/reproducibility](scripts/g1/README.md)
- [Architecture and foundation decisions (historical)](docs/foundation.md)
- [Official visual reference](docs/reference/README.md)
- [Graphics validation and independent benchmark gate](docs/graphics-validation.md)
- [Approved G1 scope and retained A1 history](docs/a1-closure-assessment-and-g1-plan.md)

G1 implementation approval supersedes the old foundation-only hold; historical reports remain intact. Visual quality, repeatable authoring and physical Windows/GPU performance remain separate acceptance categories. There is no implemented city expansion, traffic/driving, NPC population, multiplayer, interiors, progression, economy or academy backend in this build.
