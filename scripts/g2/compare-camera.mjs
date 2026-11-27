/* global console */
import fs from 'node:fs/promises';
const recordings = [
  'before-camera',
  'after-camera-webgpu',
  'after-camera-webgl2',
];
const summary = [];
for (const name of recordings) {
  const r = JSON.parse(
    await fs.readFile(`docs/evidence/g2/${name}/motion.json`, 'utf8'),
  );
  const drawn = r.telemetry.filter((s) => s.stage === 'after');
  const phases = {};
  for (const p of new Set(drawn.map((f) => f.phase))) {
    const frames = drawn.filter((f) => f.phase === p);
    phases[p] = {
      renderedFrames: frames.length,
      minimumArm: Math.min(...frames.map((f) => f.radius)),
      maximumArm: Math.max(...frames.map((f) => f.radius)),
      maxPostRenderArmPositionDisagreement: Math.max(
        ...frames.map((f) => Math.abs(f.radius - f.actual)),
      ),
    };
  }
  summary.push({
    recording: name,
    backend: r.backend,
    pageErrors: r.errors,
    renderedFrames: drawn.length,
    maxPostRenderArmPositionDisagreement: Math.max(
      ...drawn.map((f) => Math.abs(f.radius - f.actual)),
    ),
    phases,
  });
}
const result = {
  metric:
    'Absolute disagreement in metres between camera.radius and distance(camera.position,camera.target) after drawing. Tests state-lifecycle coherence, not a perceptual jitter score, temporal aliasing score, latency/FPS benchmark or every obstacle/input condition.',
  captureLimitations:
    'Software rendering; sparse native automated input; latest captures pause render scheduling for framebuffer readback, resuming between samples. Frame sequences are explicitly retimed, not uninterrupted video. Follow-up WebGPU capture precedes later visual/layout and analytic trunk-volume refinements; camera integration unchanged.',
  recordings: summary,
};
await fs.writeFile(
  'docs/evidence/g2/camera-comparison.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  summary.map((r) => ({
    recording: r.recording,
    frames: r.renderedFrames,
    errors: r.pageErrors,
    maxMismatch: r.maxPostRenderArmPositionDisagreement,
  })),
);
