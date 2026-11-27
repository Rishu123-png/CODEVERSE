# Project foundation

Status: implemented within the approved Milestone 0 scope. Validation evidence and outstanding hardware checks are in [the milestone report](milestones.md).

## Scope and intent

CodeVerse is a PC-first browser game, not a conventional website containing a small 3D demo. The long-term vision includes a persistent social city and optional programming education. Milestone 0 establishes only the rendering and development foundation. There is no previous implementation in this checkout to reuse.

The sole visual target is the [official concept reference](reference/README.md). This foundation's empty viewport is deliberately not a substitute for that target.

## Architecture

```text
React application shell (loading / ready / error UI)
  └─ GraphicsViewport lifecycle adapter
       └─ createRenderer (engine/canvas ownership, resize, loop, teardown)
            ├─ rendererPolicy (automatic selection / forced backend semantics)
            └─ createScene (neutral clear color + required inactive-input camera)
```

- TypeScript strict mode throughout; no application framework beyond React/Vite.
- React owns UI state and the host element. It mounts an imperative renderer session through one effect and aborts/disposes it on cleanup.
- Babylon owns the scene, canvas, engine, render loop, camera, GPU resources, resize observer, and loss listeners. Babylon objects are not placed into React state.
- UI changes occur for status transitions, not on every rendered frame. Buffer dimensions are written to a diagnostic DOM attribute on resize; there is no per-frame React update or FPS claim.
- `AbortSignal` prevents late async initialization from reviving an unmounted session. Successful late resources are disposed; partially created engines/canvases are cleaned on failure. Browser driver operations themselves are not abortable; cleanup runs when their pending promise settles.
- React StrictMode stays enabled to expose effect-cleanup errors. Engine disposal is idempotent at the session boundary.
- Each backend attempt uses a fresh canvas: WebGPU/WebGL context types cannot safely be interchanged on a previously bound canvas.
- An initial scene render is attempted before reporting ready. Ready means initialization, not visual or performance acceptance.
- Context/device loss stops the application render loop and surfaces a reload action. WebGL automatic restoration is disabled. Babylon may attempt internal WebGPU recovery, but the application does not resume or claim recovery; a reload is the supported restart path. Physical-device loss remains a hardware validation item.

## Backend selection

1. Parse the explicit `renderer` URL parameter; unknown values are errors.
2. Automatic mode attempts WebGPU, including secure-context and support checks, then actual engine initialization.
3. On failure, dispose partial resources and attempt WebGL2; retain the original reason.
4. Forced mode attempts exactly one backend. It must never silently fall back.
5. A WebGL2 context is requested explicitly, preventing Babylon's WebGL1 fallback.
6. Both unavailable backends produce an actionable failure state.

The renderer session is dynamically imported so the branded loading shell can appear while engine code downloads. Within that chunk, WebGL2 and scene code are statically linked; WebGPU is a further dynamic import. Babylon's stock side-effect registrations remain in place for correctness; no premature custom engine build is introduced. The production bundle currently emits a size warning; see the milestone report. No application scene assets or external font requests are made. This empty scene uses native clear operations; future GLSL translation/asset decoding dependencies must be explicitly self-hosted and tested as part of the benchmark pipeline rather than depending on an unreviewed CDN.

## Folder ownership

```text
src/app/                   React shell and UI styles
src/graphics/              Engine policy, renderer, empty scene, lifecycle adapter
src/graphics/*.test.ts     Policy, lifecycle, and scene-contract tests
tests/                     Real Chromium browser smoke tests
docs/reference/            Unmodified user-supplied official concept
docs/evidence/             Small, actual browser captures for this milestone
.github/workflows/ci.yml   Quality/build/browser-check definition
```

Root configuration provides strict TypeScript, Vite, ESLint, Prettier, Vitest, and Playwright. Dependency versions are resolved by `package-lock.json`; use `npm ci` for reproducibility. Build output, downloaded browser binaries, reports, caches, and transient test artifacts are ignored.

## Dependencies and deferred decisions

| Dependency                                                            | Purpose                                                |
| --------------------------------------------------------------------- | ------------------------------------------------------ |
| `react`, `react-dom`                                                  | Application shell and UI lifecycle                     |
| `@babylonjs/core`                                                     | Rendering engines, scene, non-interactive camera       |
| `typescript`, `@types/*`                                              | Strict typing and toolchain/React declarations         |
| `vite`, `@vitejs/plugin-react`                                        | Development server, React refresh, production bundling |
| `vitest`                                                              | Policy/lifecycle/empty-scene unit tests                |
| `@playwright/test`                                                    | Real-browser smoke tests and screenshots               |
| `eslint`, `@eslint/js`, `typescript-eslint`                           | JS/TS static checks                                    |
| `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` | React lifecycle/refresh checks and environment globals |
| `prettier`                                                            | Consistent source/documentation formatting             |

Node.js is the development toolchain only at this stage. Colyseus, PostgreSQL, backend services, Monaco, GLB loaders, texture decoders, physics, game state stores, and multiplayer code are not installed or scaffolded. Future GLB/glTF support will use Babylon-compatible loaders only when a real approved asset needs them.

No monorepo, empty packages, general-purpose game framework, or speculative service interfaces are introduced.

## Quality process

1. Obtain approval for the milestone's scope and acceptance criteria.
2. Implement the smallest coherent change, preserving working code unless a replacement is justified.
3. Run formatting, lint, strict types, unit tests, production build, then browser tests.
4. Inspect the screenshots; distinguish test-double checks, software-renderer checks, and physical-GPU validation.
5. Report exact results and limitations; keep the next milestone gated.

GitHub Actions describes the same quality pipeline on Linux, including Playwright browser setup and retained browser artifacts. Local execution does not imply that a remote GitHub Actions run has occurred. No remote CI run is claimed by this milestone.
