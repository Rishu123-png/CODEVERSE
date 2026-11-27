// Deterministic indexed-geometry tangent basis, including degenerate-UV fallback.
export function tangentsFor(p, n, uv, indices) {
  const count = p.length / 3,
    t = new Float32Array(p.length),
    b = new Float32Array(p.length);
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i],
      c = indices[i + 1],
      d = indices[i + 2],
      du = uv[c * 2] - uv[a * 2],
      dv = uv[c * 2 + 1] - uv[a * 2 + 1],
      eu = uv[d * 2] - uv[a * 2],
      ev = uv[d * 2 + 1] - uv[a * 2 + 1],
      det = du * ev - dv * eu;
    if (Math.abs(det) < 1e-9) continue;
    for (let k = 0; k < 3; k++) {
      const x = p[c * 3 + k] - p[a * 3 + k],
        y = p[d * 3 + k] - p[a * 3 + k],
        T = (x * ev - y * dv) / det,
        B = (y * du - x * eu) / det;
      for (const v of [a, c, d]) {
        t[v * 3 + k] += T;
        b[v * 3 + k] += B;
      }
    }
  }
  const result = new Float32Array(count * 4);
  for (let v = 0; v < count; v++) {
    const i = v * 3,
      N = [n[i], n[i + 1], n[i + 2]],
      dot = N.reduce((s, x, k) => s + x * t[i + k], 0);
    let T = N.map((x, k) => t[i + k] - x * dot),
      len = Math.hypot(...T);
    if (len < 1e-8) {
      T = Math.abs(N[1]) < 0.9 ? [N[2], 0, -N[0]] : [0, -N[2], N[1]];
      len = Math.hypot(...T);
    }
    T = T.map((x) => x / len);
    const C = [
        N[1] * T[2] - N[2] * T[1],
        N[2] * T[0] - N[0] * T[2],
        N[0] * T[1] - N[1] * T[0],
      ],
      w = C.reduce((s, x, k) => s + x * b[i + k], 0) < 0 ? -1 : 1;
    result.set([...T, w], v * 4);
  }
  return result;
}
