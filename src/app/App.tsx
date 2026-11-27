import { useEffect, useState } from 'react';
import {
  GraphicsViewport,
  type GraphicsStatus,
} from '../graphics/GraphicsViewport';
import { INITIAL_GAME_STATE, type GameState } from '../game/state';
const emit = (name: string) =>
  window.dispatchEvent(new Event('codeverse:' + name));
export function App() {
  const [status, setStatus] = useState<GraphicsStatus>({ phase: 'loading' });
  const [game, setGame] = useState<GameState>(INITIAL_GAME_STATE);
  useEffect(() => {
    const update = (e: Event) => setGame((e as CustomEvent<GameState>).detail);
    window.addEventListener('codeverse:state', update);
    return () => window.removeEventListener('codeverse:state', update);
  }, []);
  return (
    <main className="application" data-phase={status.phase}>
      <GraphicsViewport onStatus={setStatus} />
      <header className="brandbar">
        <div className="brand">
          <span className="brand-symbol" aria-hidden="true">
            C<span>V</span>
          </span>
          <div>
            <strong>CODEVERSE</strong>
            <span className="brand-caption">LEARN · PLAY · GROW</span>
          </div>
        </div>
        <div className="build-tag">
          G1 / FIRST PLAYABLE <span>WORK IN PROGRESS</span>
        </div>
      </header>
      {status.phase === 'loading' && (
        <section className="state-card" role="status">
          <span className="eyebrow">WELCOME TO CODEVERSE</span>
          <h1>
            Opening the plaza<span>.</span>
          </h1>
          <p>Preparing the world, character and graphics backend.</p>
          <div className="loading-track">
            <span />
          </div>
          <small>
            First visit downloads the local game assets. No account required.
          </small>
        </section>
      )}
      {status.phase === 'error' && (
        <section className="state-card error-card" role="alert">
          <span className="eyebrow">UNABLE TO ENTER THE WORLD</span>
          <h1>
            Let's get you back<span>.</span>
          </h1>
          <p>{status.message}</p>
          <p>
            Use current Chrome or Edge with hardware acceleration. WebGPU needs
            HTTPS or localhost. Check your GPU driver, network and required
            asset files.
          </p>
          <button onClick={() => window.location.reload()}>
            Retry initialization ↗
          </button>
          <small>
            Forced renderer modes never fall back to another backend.
          </small>
        </section>
      )}
      {status.phase === 'ready' && (
        <>
          <aside className="location">
            <span className="location-icon">◈</span>
            <div>
              <small>EXPLORE CODEVERSE</small>
              <h1>Central Plaza</h1>
              <p>Make your way to the blue entrance marker.</p>
            </div>
          </aside>
          <aside className="session-info" aria-label="Renderer diagnostics">
            <span className="live-dot" />
            <span data-testid="active-backend">
              {status.diagnostics.backend === 'webgpu' ? 'WebGPU' : 'WebGL2'}
            </span>
            <span className="separator">/</span>
            <span>DAYLIGHT</span>
            {status.diagnostics.fallbackReason && (
              <p data-testid="fallback-reason">
                Fallback: {status.diagnostics.fallbackReason}
              </p>
            )}
          </aside>
          {game.near && !game.interacting && !game.paused && (
            <div className="interaction-prompt" data-testid="interact-prompt">
              <kbd>E</kbd>
              <div>
                <strong>Discover CodeVerse</strong>
                <span>Central Plaza information</span>
              </div>
            </div>
          )}
          <footer className="controls">
            <span>
              <kbd>W A S D</kbd> Move
            </span>
            <span>
              <kbd>SHIFT</kbd> Run
            </span>
            <span>Drag mouse to orbit · Scroll to zoom</span>
            <span>
              <kbd>ESC</kbd> Pause
            </span>
            <button onClick={() => emit('reset')}>
              Reset position <kbd>R</kbd>
            </button>
          </footer>
          {game.interacting && (
            <div className="modal-scrim">
              <section
                className="info-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Central Plaza information"
              >
                <span className="eyebrow">01 / YOUR STARTING POINT</span>
                <h2>
                  A place to begin<span>.</span>
                </h2>
                <p>
                  Welcome to Central Plaza, the heart of CodeVerse. Explore the
                  original landmark, planted courtyard and pedestrian
                  connection.
                </p>
                <div className="info-line">
                  <strong>CodeVerse Learning City</strong>
                  <span>Original environment · first playable iteration</span>
                </div>
                <p className="muted">
                  Academy activities, interiors and the wider city are not
                  implemented in this build. This marker provides location
                  information; it does not start a quest.
                </p>
                <button autoFocus onClick={() => emit('dismiss')}>
                  Back to the plaza <span>↗</span>
                </button>
                <small>Press E or Escape to close</small>
              </section>
            </div>
          )}
          {game.paused && (
            <div className="modal-scrim">
              <section
                className="info-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Game paused"
              >
                <span className="eyebrow">TAKE A MOMENT</span>
                <h2>
                  Plaza paused<span>.</span>
                </h2>
                <p>Movement is paused. Your position is preserved.</p>
                <button autoFocus onClick={() => emit('resume')}>
                  Continue exploring ↗
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    emit('reset');
                    emit('resume');
                  }}
                >
                  Return to the starting point
                </button>
              </section>
            </div>
          )}
        </>
      )}
    </main>
  );
}
