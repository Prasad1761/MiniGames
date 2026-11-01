import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';
import { TimerManager } from '@/game-engine/core/TimerManager';

export class PerfectTimingGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private callbacks!: GameCallbacks;
  private running: boolean = false;
  private paused: boolean = false;
  private animId: number = 0;
  private lastTime: number = 0;

  private timers: TimerManager = new TimerManager();

  private cw: number = 400;
  private ch: number = 600;

  private indicatorPos: number = 0;
  private indicatorDir: number = 1;
  private speed: number = 0.022;

  private targetCenter: number = 0.5;
  private targetHalfWidth: number = 0.12;

  private score: number = 0;
  private combo: number = 0;
  private screenShake: number = 0;

  init(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
    this.resize();
  }

  private resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = rect.width || 400;
    this.ch = rect.height || 600;
    this.canvas.width = this.cw * dpr;
    this.canvas.height = this.ch * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start(seed: number = 42) {
    this.timers.clearAll();
    this.resize();
    this.running = true;
    this.paused = false;
    this.score = 0;
    this.combo = 0;
    this.speed = 0.022;
    this.indicatorPos = 0;
    this.indicatorDir = 1;
    this.targetCenter = 0.5;
    this.targetHalfWidth = 0.12;
    this.screenShake = 0;

    this.callbacks.onScoreUpdate(0);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  pause() {
    this.paused = true;
    if (this.callbacks.onPauseChange) this.callbacks.onPauseChange(true);
  }

  resume() {
    if (!this.running) return;
    this.paused = false;
    this.lastTime = performance.now();
    if (this.callbacks.onPauseChange) this.callbacks.onPauseChange(false);
  }

  restart(seed?: number) {
    this.destroy();
    this.start(seed);
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move') {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running || this.paused) return;

    const diff = Math.abs(this.indicatorPos - this.targetCenter);

    if (diff <= this.targetHalfWidth) {
      this.score++;

      const isBullseye = diff <= this.targetHalfWidth * 0.25;

      if (isBullseye) {
        this.combo++;
        sound.playPerfect(this.combo);
        triggerHaptic('medium');
        this.screenShake = 6;
      } else {
        this.combo = 0;
        sound.playScorePing();
        triggerHaptic('light');
      }

      this.callbacks.onScoreUpdate(this.score);

      this.speed = Math.min(0.022 + this.score * 0.0016, 0.055);
      this.targetHalfWidth = Math.max(0.045, 0.12 - this.score * 0.0035);
      this.targetCenter = 0.25 + Math.random() * 0.5;
    } else {
      this.onMiss();
    }
  }

  private onMiss() {
    this.running = false;
    sound.playGameOver();
    triggerHaptic('heavy');
    this.screenShake = 14;

    this.timers.setTimeout(() => {
      this.callbacks.onGameOver(this.score, { combo: this.combo });
    }, 700);
  }

  private loop = (currentTime: number) => {
    if (!this.running) return;

    if (!this.paused) {
      const deltaMs = currentTime - this.lastTime;
      const dt = Math.min(deltaMs / (1000 / 60), 2.5);
      this.lastTime = currentTime;

      this.update(dt);
      this.draw();
    } else {
      this.lastTime = currentTime;
    }

    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.indicatorPos += this.speed * this.indicatorDir * dt;

    if (this.indicatorPos >= 1) {
      this.indicatorPos = 1;
      this.indicatorDir = -1;
    } else if (this.indicatorPos <= 0) {
      this.indicatorPos = 0;
      this.indicatorDir = 1;
    }

    if (this.screenShake > 0) {
      this.screenShake *= Math.pow(0.88, dt);
      if (this.screenShake < 0.1) this.screenShake = 0;
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    ctx.save();
    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    ctx.fillStyle = '#080B12';
    ctx.fillRect(0, 0, this.cw, this.ch);

    ctx.textAlign = 'center';
    ctx.font = '900 52px Impact, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fillText(String(this.score), this.cw / 2, 80);

    if (this.combo > 1) {
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#FFE600';
      ctx.fillText(`PERFECT BULLSEYE x${this.combo}`, this.cw / 2, 115);
    }

    const meterX = 40;
    const meterY = this.ch / 2 - 20;
    const meterW = this.cw - 80;
    const meterH = 40;

    ctx.fillStyle = '#121724';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(meterX, meterY, meterW, meterH, 20);
    ctx.fill();
    ctx.stroke();

    const tzLeft = meterX + (this.targetCenter - this.targetHalfWidth) * meterW;
    const tzW = this.targetHalfWidth * 2 * meterW;

    ctx.fillStyle = 'rgba(0, 255, 163, 0.35)';
    ctx.fillRect(tzLeft, meterY + 3, tzW, meterH - 6);

    const bullseyeX = meterX + this.targetCenter * meterW;
    ctx.fillStyle = '#FFE600';
    ctx.shadowColor = '#FFE600';
    ctx.shadowBlur = 8;
    ctx.fillRect(bullseyeX - 3, meterY, 6, meterH);

    const needleX = meterX + this.indicatorPos * meterW;
    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(needleX - 4, meterY - 14, 8, meterH + 28, 4);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('TAP WHEN NEEDLE HITS GREEN ZONE', this.cw / 2, this.ch / 2 + 70);

    ctx.restore();
  }

  destroy() {
    this.running = false;
    this.timers.clearAll();
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
