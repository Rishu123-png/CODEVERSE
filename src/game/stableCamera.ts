export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
interface Spring {
  value: number;
  velocity: number;
}
/** Exact critically damped integration, independent of render frequency. */
export function dampSpring(
  s: Spring,
  goal: number,
  omega: number,
  dt: number,
): void {
  const x = s.value - goal,
    c = s.velocity + omega * x,
    decay = Math.exp(-omega * dt);
  s.value = goal + (x + c * dt) * decay;
  s.velocity = (s.velocity - omega * c * dt) * decay;
}
export class StableCameraRig {
  readonly yaw: Spring = { value: Math.PI / 2, velocity: 0 };
  readonly pitch: Spring = { value: 1.61, velocity: 0 };
  readonly arm: Spring = { value: 7.4, velocity: 0 };
  private readonly follow = [
    { value: 0, velocity: 0 },
    { value: 1.6, velocity: 0 },
    { value: 18, velocity: 0 },
  ];
  yawGoal = Math.PI / 2;
  pitchGoal = 1.61;
  requestedArm = 7.4;
  private releaseAfter = 0;
  private time = 0;
  drag(dx: number, dy: number) {
    this.yawGoal -= dx * 0.004;
    this.pitchGoal = Math.max(
      0.5,
      Math.min(1.62, this.pitchGoal - dy * 0.0035),
    );
  }
  zoom(delta: number) {
    this.requestedArm = Math.max(
      3,
      Math.min(18, this.requestedArm * Math.exp(delta * 0.0012)),
    );
  }
  rotate(dt: number) {
    dampSpring(this.yaw, this.yawGoal, 40, dt);
    dampSpring(this.pitch, this.pitchGoal, 40, dt);
  }
  reset(p: Vec3) {
    this.yaw.value = this.yawGoal = Math.PI / 2;
    this.pitch.value = this.pitchGoal = 1.61;
    this.arm.value = this.requestedArm = 7.4;
    this.yaw.velocity = this.pitch.velocity = this.arm.velocity = 0;
    [p.x, p.y + 1.6, p.z].forEach((v, i) => {
      this.follow[i].value = v;
      this.follow[i].velocity = 0;
    });
    this.time = this.releaseAfter = 0;
  }
  resolve(
    p: Vec3,
    dt: number,
    clearance: (from: Vec3, end: Vec3) => number,
  ): { target: Vec3; end: Vec3; allowed: number } {
    this.time += dt;
    [p.x, p.y + 1.6, p.z].forEach((v, i) =>
      dampSpring(this.follow[i], v, 32, dt),
    );
    const target = {
      x: this.follow[0].value,
      y: this.follow[1].value,
      z: this.follow[2].value,
    };
    const direction = {
      x: Math.cos(this.yaw.value) * Math.sin(this.pitch.value),
      y: Math.cos(this.pitch.value),
      z: Math.sin(this.yaw.value) * Math.sin(this.pitch.value),
    };
    const castLength = Math.max(this.requestedArm, this.arm.value);
    const desired = {
      x: target.x + direction.x * castLength,
      y: target.y + direction.y * castLength,
      z: target.z + direction.z * castLength,
    };
    const allowed = Math.max(
      0.35,
      Math.min(castLength, clearance(target, desired)),
    );
    // A persistent rendered arm, never restored to a second radius after drawing.
    // Immediate safe retraction; contact hysteresis prevents thin-edge pumping.
    if (allowed < this.arm.value) {
      this.arm.value = allowed;
      this.arm.velocity = Math.min(0, this.arm.velocity);
      this.releaseAfter = this.time + 0.18;
    } else if (allowed < castLength - 0.12 && allowed - this.arm.value < 0.12) {
      this.releaseAfter = this.time + 0.18;
    }
    if (this.time >= this.releaseAfter)
      dampSpring(this.arm, Math.min(allowed, this.requestedArm), 12, dt);
    this.arm.value = Math.min(allowed, this.arm.value);
    return {
      target,
      end: {
        x: target.x + direction.x * this.arm.value,
        y: target.y + direction.y * this.arm.value,
        z: target.z + direction.z * this.arm.value,
      },
      allowed,
    };
  }
}
