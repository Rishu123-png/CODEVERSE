import { describe, expect, it, vi } from 'vitest';
import { parsePreference, selectRenderer } from './rendererPolicy';

const fresh = () => ({ dispose: vi.fn() });
const signal = () => new AbortController().signal;

describe('renderer preference', () => {
  it.each(['auto', 'webgpu', 'webgl2'] as const)('accepts %s', (mode) => {
    expect(parsePreference(`?renderer=${mode}`)).toBe(mode);
  });
  it('defaults to auto', () => expect(parsePreference('')).toBe('auto'));
  it('rejects an unknown forced mode', () => {
    expect(() => parsePreference('?renderer=webgl1')).toThrow(
      'Unknown renderer',
    );
  });
});

describe('backend policy (test doubles, not GPU evidence)', () => {
  it('prefers WebGPU', async () => {
    const resource = fresh();
    const factories = {
      webgpu: vi.fn().mockResolvedValue(resource),
      webgl2: vi.fn(),
    };
    expect(await selectRenderer('auto', factories, signal())).toEqual({
      resource,
      backend: 'webgpu',
    });
    expect(factories.webgl2).not.toHaveBeenCalled();
  });
  it('reports the actual fallback reason', async () => {
    const resource = fresh();
    const factories = {
      webgpu: vi.fn().mockRejectedValue(new Error('adapter denied')),
      webgl2: vi.fn().mockResolvedValue(resource),
    };
    expect(await selectRenderer('auto', factories, signal())).toEqual({
      resource,
      backend: 'webgl2',
      fallbackReason: 'webgpu: adapter denied',
    });
  });
  it.each(['webgpu', 'webgl2'] as const)(
    'never falls back from forced %s',
    async (mode) => {
      const factories = {
        webgpu: vi.fn().mockRejectedValue(new Error('GPU failed')),
        webgl2: vi.fn().mockRejectedValue(new Error('GL failed')),
      };
      await expect(selectRenderer(mode, factories, signal())).rejects.toThrow(
        'initialization failed',
      );
      expect(
        factories[mode === 'webgpu' ? 'webgl2' : 'webgpu'],
      ).not.toHaveBeenCalled();
    },
  );
  it('reports both failures', async () => {
    await expect(
      selectRenderer(
        'auto',
        {
          webgpu: async () => {
            throw new Error('no GPU');
          },
          webgl2: async () => {
            throw new Error('no GL');
          },
        },
        signal(),
      ),
    ).rejects.toThrow('webgpu: no GPU; webgl2: no GL');
  });
  it('does not start when already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const factories = { webgpu: vi.fn(), webgl2: vi.fn() };
    await expect(
      selectRenderer('auto', factories, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(factories.webgpu).not.toHaveBeenCalled();
  });
  it('disposes a late successful initialization after cancellation', async () => {
    const controller = new AbortController();
    const resource = fresh();
    const result = selectRenderer(
      'auto',
      {
        webgpu: async () => {
          controller.abort();
          return resource;
        },
        webgl2: vi.fn(),
      },
      controller.signal,
    );
    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(resource.dispose).toHaveBeenCalledOnce();
  });
  it('does not fall back after cancellation during a failed attempt', async () => {
    const controller = new AbortController();
    const webgl2 = vi.fn();
    await expect(
      selectRenderer(
        'auto',
        {
          webgpu: async () => {
            controller.abort();
            throw new Error('cancelled');
          },
          webgl2,
        },
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(webgl2).not.toHaveBeenCalled();
  });
});
