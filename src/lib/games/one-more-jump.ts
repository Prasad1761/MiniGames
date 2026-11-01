import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';
import { TimerManager } from '@/game-engine/core/TimerManager';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export class OneMoreJumpGame implements GameInstance {
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

  private px: number = 80;
  private py: number = 400;
  private psize: number = 20;
  private vx: number = 0;
  private vy: number = 0;
  private isAirborne: boolean = false;
  private gravity: number = 0.65;
  private jumpPowerX: number = 7.5;
  private jumpPowerY: number = -11.5;

  private cameraX: number = 0;
  private targetCameraX: number = 0;

  private platforms: Platform[] = [];
  private particles: Particle[] = [];
  private score: number = 0;
  private combo: number = 0;
  private currentPlatformIndex: number = 0;

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
    this.currentPlatformIndex = 0;
    this.particles = [];
    this.cameraX = 0;
    this.targetCameraX = 0;

    const startY = this.ch - 140;
    this.platforms = [
      { x: 40, y: startY, width: 120, height: 18, color: '#00F0FF' },
    ];

    this.px = 80;
    this.py = startY - this.psize;
    this.vx = 0;
    this.vy = 0;
    this.isAirborne = false;

    for (let i = 0; i < 6; i++) {
      this.spawnNextPlatform();
    }

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

  private spawnNextPlatform() {
    const prev = this.platforms[this.platforms.length - 1];
    const gap = 110 + Math.random() * 90;
    const width = Math.max(70, 110 - this.score * 1.5);
    const height = 18;

    const deltaY = (Math.random() - 0.5) * 80;
    const clampedY = Math.max(220, Math.min(this.ch - 100, prev.y + deltaY));

    const colors = ['#00F0FF', '#00FFA3', '#FFE600', '#FF007A', '#A855F7'];
    const color = colors[this.platforms.length % colors.length];

    this.platforms.push({
      x: prev.x + prev.width + gap,
      y: clampedY,
      width,
      height,
      color,
    });
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move') {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running || this.paused || this.isAirborne) return;

    this.isAirborne = true;
    this.vx = this.jumpPowerX;
    this.vy = this.jumpPowerY;

    sound.playJump();
    triggerHaptic('medium');

    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.px + this.psize / 2,
        y: this.py + this.psize,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3,
        color: '#00FFA3',
        size: 3,
        alpha: 0.9,
      });
    }
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
    if (this.isAirborne) {
      this.px += this.vx * dt;
      this.py += this.vy * dt;
      this.vy += this.gravity * dt;

      this.targetCameraX = this.px - 100;

      for (let i = this.currentPlatformIndex + 1; i < this.platforms.length; i++) {
        const plat = this.platforms[i];

        if (
          this.vy > 0 &&
          this.py + this.psize >= plat.y &&
          this.py + this.psize <= plat.y + 18 &&
          this.px + this.psize >= plat.x &&
          this.px <= plat.x + plat.width
        ) {
          this.isAirborne = false;
          this.vy = 0;
          this.vx = 0;
          this.py = plat.y - this.psize;
          this.currentPlatformIndex = i;
          this.score++;

          const platCenter = plat.x + plat.width / 2;
          const playerCenter = this.px + this.psize / 2;
          const distToCenter = Math.abs(playerCenter - platCenter);

          if (distToCenter < 12) {
            this.combo++;
            sound.playPerfect(this.combo);
            triggerHaptic('success');
          } else {
            this.combo = 0;
            sound.playScorePing();
            triggerHaptic('light');
          }

          this.callbacks.onScoreUpdate(this.score);
          this.spawnNextPlatform();
          break;
        }
      }

      if (this.py > this.ch + 100) {
        this.running = false;
        sound.playGameOver();
        triggerHaptic('heavy');
        this.timers.setTimeout(() => {
          this.callbacks.onGameOver(this.score, { combo: this.combo });
        }, 700);
      }
    }

    this.cameraX += (this.targetCameraX - this.cameraX) * Math.min(1, 0.1 * dt);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= 0.03 * dt;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    const bg = ctx.createLinearGradient(0, 0, 0, this.ch);
    bg.addColorStop(0, '#0c0e18');
    bg.addColorStop(1, '#06070a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.cw, this.ch);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    for (const p of this.platforms) {
      if (p.x + p.width > this.cameraX - 50 && p.x < this.cameraX + this.cw + 50) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 6);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.fillRect(p.x + p.width / 2 - 4, p.y, 8, p.height);
      }
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#00FFA3';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(this.px, this.py, this.psize, this.psize, 4);
    ctx.fill();

    ctx.restore();

    ctx.font = '900 48px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(String(this.score), this.cw / 2, 70);

    if (this.combo > 1) {
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#FFE600';
      ctx.fillText(`CENTER COMBO x${this.combo}`, this.cw / 2, 98);
    }
  }

  destroy() {
    this.running = false;
    this.timers.clearAll();
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
