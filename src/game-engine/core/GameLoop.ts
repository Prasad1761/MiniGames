// High-Performance Delta-Time Normalized Game Loop

export type UpdateCallback = (dt: number) => void;
export type RenderCallback = () => void;

export class GameLoop {
  private animId: number = 0;
  private lastTime: number = 0;
  private running: boolean = false;
  private paused: boolean = false;

  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;
  private onPauseStateChange?: (isPaused: boolean) => void;

  constructor(
    onUpdate: UpdateCallback,
    onRender: RenderCallback,
    onPauseStateChange?: (isPaused: boolean) => void
  ) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.onPauseStateChange = onPauseStateChange;

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden && this.running && !this.paused) {
      this.pause();
    }
  };

  start() {
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  pause() {
    this.paused = true;
    if (this.onPauseStateChange) this.onPauseStateChange(true);
  }

  resume() {
    if (!this.running) return;
    this.paused = false;
    this.lastTime = performance.now();
    if (this.onPauseStateChange) this.onPauseStateChange(false);
  }

  togglePause(): boolean {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
    return this.paused;
  }

  isPaused(): boolean {
    return this.paused;
  }

  isRunning(): boolean {
    return this.running;
  }

  private loop = (currentTime: number) => {
    if (!this.running) return;

    if (!this.paused) {
      const deltaMs = currentTime - this.lastTime;
      // Normalize dt: 1.0 represents standard 60 FPS (16.67ms frame)
      // Clamped to avoid huge physics explosions after tab freeze
      const dt = Math.min(deltaMs / (1000 / 60), 2.5);
      this.lastTime = currentTime;

      this.onUpdate(dt);
      this.onRender();
    } else {
      this.lastTime = currentTime;
    }

    this.animId = requestAnimationFrame(this.loop);
  };

  stop() {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}
