import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  engines: [] as Array<{
    dispose: ReturnType<typeof vi.fn>;
    stopRenderLoop: ReturnType<typeof vi.fn>;
    runRenderLoop: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    beginFrame: ReturnType<typeof vi.fn>;
    endFrame: ReturnType<typeof vi.fn>;
    onContextLostObservable: {
      add: ReturnType<typeof vi.fn>;
      remove: ReturnType<typeof vi.fn>;
    };
  }>,
  scene: { render: vi.fn(), dispose: vi.fn() },
  frameOrder: [] as string[],
  gameDispose: vi.fn(),
  gameCreate: vi.fn(),
  supported: true,
  init: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('@babylonjs/core/Engines/engine', () => {
  class Engine {
    webGLVersion = 2;
    dispose = vi.fn();
    stopRenderLoop = vi.fn();
    runRenderLoop = vi.fn();
    resize = vi.fn();
    beginFrame = vi.fn(() => mocks.frameOrder.push('begin'));
    endFrame = vi.fn(() => mocks.frameOrder.push('end'));
    getRenderWidth = () => 1280;
    getRenderHeight = () => 720;
    onContextLostObservable = { add: vi.fn(), remove: vi.fn() };
    constructor() {
      mocks.engines.push(this);
    }
  }
  return { Engine };
});
vi.mock('@babylonjs/core/Engines/webgpuEngine', async () => {
  const { Engine } = await import('@babylonjs/core/Engines/engine');
  class WebGPUEngine extends Engine {
    static get IsSupportedAsync() {
      return Promise.resolve(mocks.supported);
    }
    initAsync = mocks.init;
  }
  return { WebGPUEngine };
});
vi.mock('./createScene', () => ({ createScene: () => mocks.scene }));
vi.mock('../game/createGame', () => ({
  createGame: mocks.gameCreate,
}));

import { createRenderer } from './createRenderer';

function fixture() {
  const canvases: Array<ReturnType<typeof makeCanvas>> = [];
  function makeCanvas() {
    return {
      setAttribute: vi.fn(),
      getContext: vi.fn().mockReturnValue({}),
      remove: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  }
  vi.stubGlobal('document', {
    createElement: () => {
      const c = makeCanvas();
      canvases.push(c);
      return c;
    },
  });
  vi.stubGlobal('window', { isSecureContext: true });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      disconnect = mocks.disconnect;
    },
  );
  return {
    host: { append: vi.fn() } as unknown as HTMLElement,
    canvases,
    controller: new AbortController(),
    resize: vi.fn(),
    lost: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.engines.length = 0;
  mocks.frameOrder.length = 0;
  mocks.scene.render
    .mockReset()
    .mockImplementation(() => mocks.frameOrder.push('render'));
  mocks.supported = true;
  mocks.init.mockReset().mockResolvedValue(undefined);
  mocks.gameCreate.mockReset().mockResolvedValue(mocks.gameDispose);
});
afterEach(() => vi.unstubAllGlobals());

describe('renderer lifecycle with engine/DOM test doubles', () => {
  it.each(['webgl2', 'webgpu'] as const)(
    'brackets the first frame and cleans %s resources exactly once',
    async (backend) => {
      const f = fixture();
      const session = await createRenderer(
        f.host,
        backend,
        f.controller.signal,
        f.resize,
        f.lost,
      );
      expect(mocks.engines[0].runRenderLoop).toHaveBeenCalledOnce();
      expect(mocks.frameOrder).toEqual(['begin', 'render', 'end']);
      expect(f.resize).toHaveBeenCalledWith(1280, 720);
      f.controller.abort();
      session.dispose();
      expect(mocks.disconnect).toHaveBeenCalledOnce();
      expect(mocks.engines[0].stopRenderLoop).toHaveBeenCalledOnce();
      expect(mocks.engines[0].dispose).toHaveBeenCalledOnce();
      expect(mocks.scene.dispose).toHaveBeenCalledOnce();
      expect(mocks.gameDispose).toHaveBeenCalledOnce();
      expect(f.canvases[0].remove).toHaveBeenCalledOnce();
    },
  );
  it('cleans failed WebGPU resources and uses a fresh fallback canvas', async () => {
    const f = fixture();
    mocks.init.mockRejectedValue(new Error('device init failed'));
    const session = await createRenderer(
      f.host,
      'auto',
      f.controller.signal,
      f.resize,
      f.lost,
    );
    expect(f.canvases).toHaveLength(2);
    expect(f.canvases[0].remove).toHaveBeenCalledOnce();
    expect(mocks.engines[0].dispose).toHaveBeenCalledOnce();
    expect(session.diagnostics.fallbackReason).toContain('device init failed');
    session.dispose();
  });
  it('cleans a forced backend failure without starting WebGL2', async () => {
    const f = fixture();
    mocks.init.mockRejectedValue(new Error('failed'));
    await expect(
      createRenderer(f.host, 'webgpu', f.controller.signal, f.resize, f.lost),
    ).rejects.toThrow('failed');
    expect(f.canvases).toHaveLength(1);
    expect(f.canvases[0].remove).toHaveBeenCalledOnce();
    expect(mocks.engines[0].dispose).toHaveBeenCalledOnce();
  });
  it('cleans resources if the initial scene render fails', async () => {
    const f = fixture();
    mocks.scene.render.mockImplementationOnce(() => {
      mocks.frameOrder.push('render-error');
      throw new Error('render failed');
    });
    await expect(
      createRenderer(f.host, 'webgl2', f.controller.signal, f.resize, f.lost),
    ).rejects.toThrow('render failed');
    expect(mocks.frameOrder).toEqual(['begin', 'render-error', 'end']);
    expect(mocks.engines[0].runRenderLoop).not.toHaveBeenCalled();
    expect(mocks.scene.dispose).toHaveBeenCalledOnce();
    expect(mocks.engines[0].dispose).toHaveBeenCalledOnce();
    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });
  it('stops rendering and reports device/context loss once', async () => {
    const f = fixture();
    const session = await createRenderer(
      f.host,
      'webgl2',
      f.controller.signal,
      f.resize,
      f.lost,
    );
    const callback =
      mocks.engines[0].onContextLostObservable.add.mock.calls[0][0];
    callback();
    callback();
    expect(f.lost).toHaveBeenCalledOnce();
    expect(mocks.engines[0].stopRenderLoop).toHaveBeenCalledOnce();
    session.dispose();
  });
  it('supports dispose and remount without overlapping live sessions', async () => {
    const f = fixture();
    const first = await createRenderer(
      f.host,
      'webgl2',
      f.controller.signal,
      f.resize,
      f.lost,
    );
    first.dispose();
    const second = await createRenderer(
      f.host,
      'webgl2',
      f.controller.signal,
      f.resize,
      f.lost,
    );
    expect(mocks.engines[0].dispose).toHaveBeenCalledOnce();
    expect(mocks.engines[1].dispose).not.toHaveBeenCalled();
    second.dispose();
  });
});

it('disposes an engine whose asynchronous init completes after unmount', async () => {
  const f = fixture();
  let finish: (() => void) | undefined;
  mocks.init.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const pending = createRenderer(
    f.host,
    'auto',
    f.controller.signal,
    f.resize,
    f.lost,
  );
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
  f.controller.abort();
  finish!();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(mocks.engines[0].dispose).toHaveBeenCalledOnce();
  expect(mocks.engines[0].runRenderLoop).not.toHaveBeenCalled();
  expect(f.canvases).toHaveLength(1);
  expect(f.canvases[0].remove).toHaveBeenCalledOnce();
});

it('reports world asset load failure without retrying another backend', async () => {
  const f = fixture();
  mocks.gameCreate.mockRejectedValueOnce(new Error('hero.glb failed to load'));
  await expect(
    createRenderer(f.host, 'auto', f.controller.signal, f.resize, f.lost),
  ).rejects.toThrow('hero.glb failed to load');
  expect(f.canvases).toHaveLength(1);
  expect(mocks.scene.dispose).toHaveBeenCalledOnce();
  expect(mocks.engines[0].dispose).toHaveBeenCalledOnce();
  expect(mocks.engines[0].runRenderLoop).not.toHaveBeenCalled();
});

it('cleans a world that finishes asynchronously after cancellation', async () => {
  const f = fixture();
  let finish: (() => void) | undefined;
  mocks.gameCreate.mockImplementationOnce(
    () =>
      new Promise<() => void>((resolve) => {
        finish = () => resolve(mocks.gameDispose);
      }),
  );
  const pending = createRenderer(
    f.host,
    'webgl2',
    f.controller.signal,
    f.resize,
    f.lost,
  );
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
  f.controller.abort();
  expect(mocks.scene.dispose).toHaveBeenCalledOnce();
  expect(mocks.engines[0].dispose).toHaveBeenCalledOnce();
  finish!();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(mocks.gameDispose).toHaveBeenCalledOnce();
  expect(mocks.engines[0].runRenderLoop).not.toHaveBeenCalled();
  expect(mocks.scene.dispose).toHaveBeenCalledOnce();
});
