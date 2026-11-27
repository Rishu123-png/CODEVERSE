export type Backend = 'webgpu' | 'webgl2';
export type BackendPreference = 'auto' | Backend;

export function parsePreference(search: string): BackendPreference {
  const value = new URLSearchParams(search).get('renderer') ?? 'auto';
  if (value === 'auto' || value === 'webgpu' || value === 'webgl2')
    return value;
  throw new Error(`Unknown renderer "${value}". Use auto, webgpu, or webgl2.`);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function checkAborted(signal: AbortSignal): void {
  if (signal.aborted)
    throw new DOMException('Renderer startup cancelled', 'AbortError');
}

// Factories own partial-initialization cleanup. Policy owns successful resources
// until they have been transferred to the caller (including late cancellation).
export async function selectRenderer<T extends { dispose(): void }>(
  preference: BackendPreference,
  factories: Record<Backend, () => Promise<T>>,
  signal: AbortSignal,
): Promise<{ resource: T; backend: Backend; fallbackReason?: string }> {
  const order: Backend[] =
    preference === 'auto' ? ['webgpu', 'webgl2'] : [preference];
  const failures: string[] = [];
  for (const backend of order) {
    checkAborted(signal);
    let resource: T;
    try {
      resource = await factories[backend]();
    } catch (error) {
      checkAborted(signal);
      failures.push(`${backend}: ${errorMessage(error)}`);
      continue;
    }
    if (signal.aborted) {
      resource.dispose();
      checkAborted(signal);
    }
    return {
      resource,
      backend,
      fallbackReason: failures.length ? failures.join('; ') : undefined,
    };
  }
  throw new Error(`Renderer initialization failed. ${failures.join('; ')}`);
}
