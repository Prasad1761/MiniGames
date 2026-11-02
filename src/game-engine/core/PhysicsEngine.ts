// src/game-engine/core/PhysicsEngine.ts
// A minimal physics utility that can be imported by games.
// Currently it exposes a single step() that advanced entities by a normalized delta.

export interface PhysicsEntity {
  position: number;
  velocity: number;
  // Collider size or bounds can be added when needed.
}

export class PhysicsEngine {
  private entities: PhysicsEntity[] = [];

  add(entity: PhysicsEntity): void {
    this.entities.push(entity);
  }

  /**
   * advances entities by delta milliseconds (dt in ms).  We normalize dt to a 60 fps baseline.
   * If dt is larger than 40 ms it is clamped to 100 % of the baseline.
   */
  step(dtMs: number): void {
    const dtSeconds = dtMs / 1000;
    const clamped = dtSeconds > 0.0667 ? 0.0667 : dtSeconds; // 66.7ms ≈ 60fps
    for (const e of this.entities) {
      e.position += e.velocity * clamped;
    }
  }
}
