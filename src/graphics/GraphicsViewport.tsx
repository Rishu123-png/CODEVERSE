import { useEffect, useRef } from 'react';
import type { RendererDiagnostics } from './createRenderer';
import { checkAborted, errorMessage, parsePreference } from './rendererPolicy';

export type GraphicsStatus =
  | { phase: 'loading' }
  | { phase: 'ready'; diagnostics: RendererDiagnostics }
  | { phase: 'error'; message: string };

export function GraphicsViewport({
  onStatus,
}: {
  onStatus: (status: GraphicsStatus) => void;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    let dispose: (() => void) | undefined;
    let failed = false;
    const fail = (message: string) => {
      failed = true;
      if (!controller.signal.aborted) onStatus({ phase: 'error', message });
    };
    void (async () => {
      try {
        const preference = parsePreference(window.location.search);
        // Show the branded shell while engine code downloads, not only during init.
        const { createRenderer } = await import('./createRenderer');
        checkAborted(controller.signal);
        const session = await createRenderer(
          host.current!,
          preference,
          controller.signal,
          (width, height) => {
            host.current?.setAttribute(
              'data-buffer-size',
              `${width}×${height}`,
            );
          },
          () =>
            fail(
              'The graphics device or context was lost. Reload to initialize a new session.',
            ),
        );
        dispose = session.dispose;
        if (controller.signal.aborted || failed) session.dispose();
        else onStatus({ phase: 'ready', diagnostics: session.diagnostics });
      } catch (error) {
        if (!controller.signal.aborted) fail(errorMessage(error));
      }
    })();
    return () => {
      controller.abort();
      dispose?.();
    };
  }, [onStatus]);

  return (
    <div
      ref={host}
      className="graphics-viewport"
      data-testid="graphics-viewport"
    />
  );
}
