import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';
import { TimerManager } from '@/game-engine/core/TimerManager';

interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class ImpossibleMazeGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private callbacks!: GameCallbacks;
  private running: boolean = false;
  private paused: boolean = false;
  private animId: number = 0;

  private timers: TimerManager = new TimerManager();

  private cw: number = 400;
  private ch: number = 600;

  private px: number = 60;
  private py: number = 100;
  private pradius: number = 12;

  private gx: number = 340;
  private gy: number = 520;
  private gradius: number = 24;

  private stage: number = 1;
  private walls: Wall[] = [];
  private isTouching: boolean = false;

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
    this.stage = 1;
    this.generateStage();

    this.callbacks.onScoreUpdate(1);
    this.loop();
  }

  pause() {
    this.paused = true;
    if (this.callbacks.onPauseChange) this.callbacks.onPauseChange(true);
  }

  resume() {
    this.paused = false;
    if (this.callbacks.onPauseChange) this.callbacks.onPauseChange(false);
  }

  restart(seed?: number) {
    this.destroy();
    this.start(seed);
  }

  private generateStage() {
    this.px = 50;
    this.py = 90;
    this.gx = this.cw - 50;
    this.gy = this.ch - 80;
    this.isTouching = false;

    this.walls = [
      { x: 10, y: 50, w: this.cw - 20, h: 10 },
      { x: 10, y: this.ch - 20, w: this.cw - 20, h: 10 },
      { x: 10, y: 50, w: 10, h: this.ch - 70 },
      { x: this.cw - 20, y: 50, w: 10, h: this.ch - 70 },
    ];

    const mazePatterns = [
      [
        { x: 10, y: 180, w: this.cw * 0.72, h: 14 },
        { x: this.cw * 0.28, y: 320, w: this.cw * 0.72, h: 14 },
        { x: 10, y: 440, w: this.cw * 0.72, h: 14 },
      ],
      [
        { x: 90, y: 160, w: 14, h: 220 },
        { x: 220, y: 240, w: 14, h: 220 },
        { x: 90, y: 380, w: 140, h: 14 },
      ],
      [
        { x: 80, y: 50, w: 14, h: 360 },
        { x: 180, y: 160, w: 14, h: 380 },
        { x: 280, y: 50, w: 14, h: 360 },
      ],
    ];

    const pattern = mazePatterns[(this.stage - 1) % mazePatterns.length];
    this.walls.push(...pattern);
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move', clientX?: number, clientY?: number) {
    if (!this.running || this.paused || !clientX || !clientY) {
      if (type === 'release') this.isTouching = false;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (type === 'release') {
      this.isTouching = false;
      return;
    }

    // Touch initiation: must grab orb near its current position
    const distToOrb = Math.hypot(x - this.px, y - this.py);
    if (!this.isTouching) {
      if (distToOrb <= this.pradius * 3) {
        this.isTouching = true;
      } else {
        return; // Reject distant touches (prevents teleporting to goal)
      }
    }

    // Move in small incremental steps along trajectory to prevent jumping through walls
    const dx = x - this.px;
    const dy = y - this.py;
    const totalDist = Math.hypot(dx, dy);
    const stepSize = 4;
    const steps = Math.ceil(totalDist / stepSize);

    for (let s = 1; s <= steps; s++) {
      const stepT = s / steps;
      const testX = this.px + dx * stepT;
      const testY = this.py + dy * stepT;

      for (const w of this.walls) {
        if (
          testX + this.pradius > w.x &&
          testX - this.pradius < w.x + w.w &&
          testY + this.pradius > w.y &&
          testY - this.pradius < w.y + w.h
        ) {
          this.onHitWall();
          return;
        }
      }
    }

    this.px = x;
    this.py = y;

    const distToGoal = Math.hypot(this.px - this.gx, this.py - this.gy);
    if (distToGoal < this.gradius) {
      this.onReachGoal();
    }
  }

  private onReachGoal() {
    sound.playScorePing();
    triggerHaptic('success');
    this.stage++;
    this.callbacks.onScoreUpdate(this.stage);
    this.generateStage();
  }

  private onHitWall() {
    this.running = false;
    sound.playGameOver();
    triggerHaptic('heavy');
    this.timers.setTimeout(() => {
      this.callbacks.onGameOver(this.stage);
    }, 700);
  }

  private loop = () => {
    if (!this.running) return;
    this.draw();
    this.animId = requestAnimationFrame(this.loop);
  };

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    ctx.fillStyle = '#080A10';
    ctx.fillRect(0, 0, this.cw, this.ch);

    ctx.font = '900 36px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`STAGE ${this.stage}`, this.cw / 2, 40);

    ctx.fillStyle = '#FF0055';
    ctx.shadowColor = '#FF0055';
    ctx.shadowBlur = 10;
    for (const w of this.walls) {
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#00FFA3';
    ctx.shadowColor = '#00FFA3';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(this.gx, this.gy, this.gradius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText('PORTAL', this.gx, this.gy + 4);

    ctx.fillStyle = '#00F0FF';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(this.px, this.py, this.pradius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(this.px, this.py, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  destroy() {
    this.running = false;
    this.timers.clearAll();
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
