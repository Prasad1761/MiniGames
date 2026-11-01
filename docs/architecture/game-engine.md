# ArcadePulse V2 — Game Engine Architecture

## 1. Overview

ArcadePulse V2 powers 10 original mini-games using a modular HTML5 Canvas 2D engine. The architecture is engineered around four core systems:
1. **Delta-Time Normalization (`GameLoop`)**
2. **Unified Resource Disposal (`TimerManager`)**
3. **Responsive Coordinate Mapping (`InputManager`)**
4. **Deterministic Random Generation (`PRNG` / Mulberry32)**

---

## 2. Delta-Time Normalization

### The 120Hz/144Hz Refresh Rate Problem
In V1, sprite positions and physics updates were incremented by static constant values on each frame:
```typescript
// V1 Legacy Anti-Pattern
x += speed; // Doubled in speed on 120Hz iPad / high-refresh monitors!
```

### The V2 Solution
All games calculate the elapsed milliseconds between animation frames and scale motion based on a standard 60 FPS baseline (16.6667ms per frame):

```typescript
const now = performance.now();
const deltaMs = Math.min(now - lastTime, 100); // 100ms clamp prevents large jumps on tab switch
const dt = Math.min(deltaMs / (1000 / 60), 2.5); // 1.0 = standard 60 FPS
lastTime = now;

// Physics integration scaled by dt:
position.y += velocity.y * dt;
velocity.y += gravity * dt;
```

---

## 3. Resource & Memory Management (`TimerManager`)

### Memory Leak Elimination
In browser mini-games, players restart rounds within seconds or switch games frequently. Standard `setTimeout` and `setInterval` calls that are not tracked continue running in the background after the game component unmounts, leading to memory leaks, stray canvas operations, and frame-rate degradation.

`TimerManager` maintains sets of all active timer handles:
```typescript
export class TimerManager {
  private timeoutIds: Set<any> = new Set();
  private intervalIds: Set<any> = new Set();

  setTimeout(handler: () => void, timeoutMs: number): any {
    const id = setTimeout(() => {
      this.timeoutIds.delete(id);
      handler();
    }, timeoutMs);
    this.timeoutIds.add(id);
    return id;
  }

  clearAll() {
    this.timeoutIds.forEach((id) => clearTimeout(id));
    this.timeoutIds.clear();
    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds.clear();
  }
}
```
When `destroy()` is called on any of the 10 game instances, `timers.clearAll()` terminates all pending callbacks instantaneously.

---

## 4. Input & DPI Coordinate Mapping

Touch devices have varying device pixel ratios (DPR), typically 2x or 3x on Retina displays. If canvas width/height are set via CSS without scaling the underlying bitmap, blurriness and offset tap coordinates result.

`GameShell` ensures crisp pixel sharpness and touch accuracy:
```typescript
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```
Input events (touch and mouse) compute bounding-client-rect relative offsets:
```typescript
const rect = canvas.getBoundingClientRect();
const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
const gameX = clientX - rect.left;
const gameY = clientY - rect.top;
```

---

## 5. Exploit Prevention: Impossible Maze Anti-Teleportation

In V1, players could touch the start zone, lift their finger, and tap directly onto the goal checkpoint without traversing the maze walls.

In V2, `impossible-maze.ts` enforces:
1. **Touch Proximity Verification**: The touch or pointer MUST initiate within 35px of the designated start portal.
2. **Path Continuity Tracing**: `lastX` and `lastY` are tracked on every `touchmove` / `mousemove`.
3. **Sub-Step Raycasting**: Fast movements are divided into small raycast increments to guarantee that jumping over a 10px wall fails even with high-velocity dragging.

---

## 6. Mini-Game Catalog Specifications

| ID | Title | Category | Primary Mechanic | Scoring Metric | Exploit Guard |
|---|---|---|---|---|---|
| `perfect-stack` | Perfect Stack | Precision | Moving block alignment & combo combo-streak | Blocks stacked | Max 500 blocks, combo validation |
| `reaction-test` | Reaction Test | Reflex | Random interval color shift response | Milliseconds (lower is better) | Sub-75ms superhuman filter |
| `gravity-flip` | Gravity Flip | Speed | Tap to invert gravity between floor and ceiling | Distance in meters | Min 50ms per meter |
| `color-panic` | Color Panic | Reflex | Match target color before countdown | Correct matches | Speed clamp |
| `one-more-jump` | One More Jump | Precision | Charge and release arc jumper | Platforms cleared | Max 300 platforms |
| `dont-tap-red` | Don't Tap Red | Speed | Fast grid tapping avoiding hazard tiles | Points | Fast-tap threshold |
| `memory-flash` | Memory Flash | Puzzle | Memorize tile light sequences | Rounds cleared | Sequence length bounds |
| `perfect-timing` | Perfect Timing | Precision | Oscillating needle sweet-spot stop | Precision score | Target radius tolerance |
| `merge-rush` | Merge Rush | Puzzle | 2048-style grid merge | Merged tile score | Move sequence verification |
| `impossible-maze` | Impossible Maze | Precision | Continuous touch maze navigation | Mazes cleared | Continuous raycast check |
