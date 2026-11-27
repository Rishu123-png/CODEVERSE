import { Engine } from '@babylonjs/core/Engines/engine';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { createScene } from './createScene';
import { createGame } from '../game/createGame';
import {
  checkAborted,
  selectRenderer,
  type Backend,
  type BackendPreference,
} from './rendererPolicy';

export interface RendererDiagnostics {
  backend: Backend;
  fallbackReason?: string;
  width: number;
  height: number;
}

export interface RendererSession {
  diagnostics: RendererDiagnostics;
  dispose(): void;
}

export async function createRenderer(
  host: HTMLElement,
  preference: BackendPreference,
  signal: AbortSignal,
  onResize: (width: number, height: number) => void,
  onLost: () => void,
): Promise<RendererSession> {
  const attempt = async (backend: Backend) => {
    // A failed WebGPU initialization may bind its canvas context permanently.
    // Each attempt therefore owns a separate canvas and engine.
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'CodeVerse rendering surface');
    host.append(canvas);
    let engine: AbstractEngine | undefined;
    let disposed = false;
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      engine?.dispose();
      canvas.remove();
    };
    try {
      checkAborted(signal);
      if (backend === 'webgpu') {
        if (!window.isSecureContext)
          throw new Error('WebGPU requires HTTPS or localhost');
        const { WebGPUEngine } =
          await import('@babylonjs/core/Engines/webgpuEngine');
        checkAborted(signal);
        if (!(await WebGPUEngine.IsSupportedAsync))
          throw new Error('WebGPU is unavailable');
        checkAborted(signal);
        const gpuEngine = new WebGPUEngine(canvas, { antialias: true });
        engine = gpuEngine;
        await gpuEngine.initAsync();
      } else {
        // Explicit WebGL2 context prevents Babylon from quietly using WebGL1.
        const context = canvas.getContext('webgl2', {
          antialias: true,
          alpha: false,
        });
        if (!context) throw new Error('WebGL2 is unavailable or disabled');
        const glEngine = new Engine(context, true, {
          doNotHandleContextLost: true,
        });
        engine = glEngine;
        if (glEngine.webGLVersion !== 2)
          throw new Error('WebGL2 initialization did not succeed');
      }
      checkAborted(signal);
      if (!engine) throw new Error('Engine was not created');
      return { engine, canvas, dispose };
    } catch (error) {
      dispose();
      throw error;
    }
  };

  const selected = await selectRenderer(
    preference,
    { webgpu: () => attempt('webgpu'), webgl2: () => attempt('webgl2') },
    signal,
  );
  const { engine, canvas } = selected.resource;
  let cleanupRuntime: (() => void) | undefined;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener('abort', dispose);
    cleanupRuntime?.();
    selected.resource.dispose();
  };

  try {
    checkAborted(signal);
    const scene = createScene(engine);
    cleanupRuntime = () => scene.dispose();
    signal.addEventListener('abort', dispose, { once: true });
    const disposeGame = await createGame(scene, canvas, signal);
    if (signal.aborted) {
      disposeGame();
      checkAborted(signal);
    }
    let lost = false;
    const render = () => scene.render();
    const handleLoss = () => {
      if (lost || disposed) return;
      lost = true;
      engine.stopRenderLoop(render);
      onLost();
    };
    const observer = engine.onContextLostObservable.add(handleLoss);
    canvas.addEventListener('webglcontextlost', handleLoss);
    const diagnostics: RendererDiagnostics = {
      backend: selected.backend,
      fallbackReason: selected.fallbackReason,
      width: 0,
      height: 0,
    };
    const resize = () => {
      if (disposed || lost) return;
      engine.resize();
      diagnostics.width = engine.getRenderWidth();
      diagnostics.height = engine.getRenderHeight();
      onResize(diagnostics.width, diagnostics.height);
    };
    const resizeObserver = new ResizeObserver(resize);
    cleanupRuntime = () => {
      disposeGame();
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleLoss);
      engine.onContextLostObservable.remove(observer);
      engine.stopRenderLoop(render);
      scene.dispose();
    };
    resizeObserver.observe(host);
    signal.addEventListener('abort', dispose, { once: true });
    resize();
    // WebGPU records uploads/draws until endFrame submits them. A bare
    // scene.render() here leaves commands referencing the first swap-chain/MSAA
    // target; presentation/resize can expire it before submission and invalidate the
    // ENTIRE submission (including textures and light buffers), yielding black.
    // Keep the first render inside the same frame boundary as the normal loop.
    engine.beginFrame();
    try {
      scene.render();
    } finally {
      engine.endFrame();
    }
    engine.runRenderLoop(render);
    return { diagnostics, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
