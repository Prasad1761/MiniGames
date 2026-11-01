import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';
import { TimerManager } from '@/game-engine/core/TimerManager';

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface SlicedPiece {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  opacity: number;
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

interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

export class PerfectStackGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private callbacks!: GameCallbacks;
  private running: boolean = false;
  private paused: boolean = false;
  private animId: number = 0;
  private lastTime: number = 0;

  private timers: TimerManager = new TimerManager();

  private stack: Block[] = [];
  private currentBlock: Block | null = null;
  private slicedPieces: SlicedPiece[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  private currentDirection: number = 1; // 1: right, -1: left
  private speed: number = 3.5;
  private baseSpeed: number = 3.5;
  private blockHeight: number = 24;
  private combo: number = 0;
  private score: number = 0;
  private cameraY: number = 0;
  private targetCameraY: number = 0;
  private screenShake: number = 0;
  private hueBase: number = 200;

  private cw: number = 400;
  private ch: number = 600;

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
    this.speed = this.baseSpeed;
    this.hueBase = Math.abs(seed) % 360;
    this.slicedPieces = [];
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.cameraY = 0;
    this.targetCameraY = 0;

    const initialWidth = Math.min(this.cw * 0.6, 200);
    const startY = this.ch - 80;

    const baseBlock: Block = {
      x: (this.cw - initialWidth) / 2,
      y: startY,
      width: initialWidth,
      height: this.blockHeight,
      color: `hsl(${this.hueBase}, 85%, 60%)`,
    };

    this.stack = [baseBlock];
    this.spawnNextBlock();

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
    this.start(seed ?? Math.floor(Math.random() * 10000));
  }

  private spawnNextBlock() {
    const prev = this.stack[this.stack.length - 1];
    const layer = this.stack.length;
    const hue = (this.hueBase + layer * 14) % 360;

    this.currentDirection = Math.random() > 0.5 ? 1 : -1;
    const startX = this.currentDirection === 1 ? -prev.width : this.cw;

    this.currentBlock = {
      x: startX,
      y: prev.y - this.blockHeight,
      width: prev.width,
      height: this.blockHeight,
      color: `hsl(${hue}, 85%, 60%)`,
    };

    const visibleThreshold = this.ch * 0.55;
    if (this.currentBlock.y < visibleThreshold) {
      this.targetCameraY = visibleThreshold - this.currentBlock.y;
    }
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move') {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running || this.paused || !this.currentBlock) return;

    this.dropBlock();
  }

  private dropBlock() {
    if (!this.currentBlock) return;
    const prev = this.stack[this.stack.length - 1];
    const curr = this.currentBlock;
    const diff = curr.x - prev.x;
    const absDiff = Math.abs(diff);

    const PERFECT_THRESHOLD = 3.5;

    if (absDiff <= PERFECT_THRESHOLD) {
      // PERFECT HIT
      curr.x = prev.x;
      this.combo++;
      this.score++;

      sound.playPerfect(this.combo);
      triggerHaptic('medium');
      this.screenShake = Math.min(this.screenShake + 5, 12);
      this.spawnSparks(curr.x + curr.width / 2, curr.y + curr.height / 2, curr.color);

      const comboText = this.combo > 1 ? `PERFECT x${this.combo}!` : 'PERFECT!';
      this.floatingTexts.push({
        text: comboText,
        x: curr.x + curr.width / 2,
        y: curr.y - 15,
        color: '#00FFA3',
        alpha: 1,
        scale: 1.2,
      });

      if (this.combo > 0 && this.combo % 5 === 0) {
        curr.width = Math.min(curr.width + 12, this.cw * 0.7);
        curr.x = Math.max(0, curr.x - 6);
        this.floatingTexts.push({
          text: '+RECOVERY BONUS!',
          x: curr.x + curr.width / 2,
          y: curr.y - 35,
          color: '#FFE600',
          alpha: 1,
          scale: 1,
        });
      }

      this.stack.push(curr);
      this.speed = Math.min(this.baseSpeed + this.score * 0.12, 9.5);
      this.callbacks.onScoreUpdate(this.score);
      if (this.callbacks.onCombo) this.callbacks.onCombo(this.combo);
      this.spawnNextBlock();

    } else if (absDiff < prev.width) {
      // PARTIAL HIT
      this.combo = 0;
      this.score++;

      const newWidth = prev.width - absDiff;
      const placedX = diff > 0 ? curr.x : prev.x;
      const sliceX = diff > 0 ? curr.x + newWidth : curr.x;
      const sliceWidth = absDiff;

      sound.playSlice();
      triggerHaptic('light');

      curr.x = placedX;
      curr.width = newWidth;
      this.stack.push(curr);

      this.slicedPieces.push({
        x: sliceX,
        y: curr.y,
        width: sliceWidth,
        height: curr.height,
        color: curr.color,
        vx: diff > 0 ? 2.5 : -2.5,
        vy: 1,
        rotation: 0,
        vRot: diff > 0 ? 0.05 : -0.05,
        opacity: 1,
      });

      this.speed = Math.min(this.baseSpeed + this.score * 0.12, 9.5);
      this.callbacks.onScoreUpdate(this.score);
      this.spawnNextBlock();

    } else {
      // COMPLETE MISS
      this.running = false;
      sound.playGameOver();
      triggerHaptic('heavy');
      this.screenShake = 15;

      this.slicedPieces.push({
        x: curr.x,
        y: curr.y,
        width: curr.width,
        height: curr.height,
        color: curr.color,
        vx: this.currentDirection * 2,
        vy: 2,
        rotation: 0,
        vRot: this.currentDirection * 0.08,
        opacity: 1,
      });

      this.currentBlock = null;

      // Safe managed timeout
      this.timers.setTimeout(() => {
        this.callbacks.onGameOver(this.score, { combo: this.combo, height: this.stack.length });
      }, 700);
    }
  }

  private spawnSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: Math.random() > 0.4 ? color : '#FFFFFF',
        size: 3 + Math.random() * 3,
        alpha: 1,
      });
    }
  }

  private loop = (currentTime: number) => {
    if (!this.running) return;

    if (!this.paused) {
      const deltaMs = currentTime - this.lastTime;
      // Normalized delta-time (1.0 = 60 FPS standard)
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
    this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, 0.1 * dt);

    if (this.screenShake > 0) {
      this.screenShake *= Math.pow(0.88, dt);
      if (this.screenShake < 0.1) this.screenShake = 0;
    }

    if (this.running && this.currentBlock) {
      this.currentBlock.x += this.speed * this.currentDirection * dt;
      const boundRight = this.cw - this.currentBlock.width;

      if (this.currentBlock.x >= boundRight + 40) {
        this.currentBlock.x = boundRight + 40;
        this.currentDirection = -1;
      } else if (this.currentBlock.x <= -40) {
        this.currentBlock.x = -40;
        this.currentDirection = 1;
      }
    }

    for (let i = this.slicedPieces.length - 1; i >= 0; i--) {
      const p = this.slicedPieces[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.55 * dt;
      p.rotation += p.vRot * dt;
      p.opacity -= 0.012 * dt;

      if (p.opacity <= 0 || p.y - this.cameraY > this.ch + 100) {
        this.slicedPieces.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 0.15 * dt;
      pt.alpha -= 0.025 * dt;
      pt.size *= Math.pow(0.96, dt);

      if (pt.alpha <= 0 || pt.size <= 0.5) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2 * dt;
      ft.alpha -= 0.02 * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    ctx.save();

    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, this.ch);
    grad.addColorStop(0, '#0d111a');
    grad.addColorStop(1, '#080a0f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.cw, this.ch);

    const bloomGrad = ctx.createRadialGradient(
      this.cw / 2, this.ch / 2, 20,
      this.cw / 2, this.ch / 2, this.cw * 0.7
    );
    bloomGrad.addColorStop(0, `hsla(${(this.hueBase + this.score * 10) % 360}, 80%, 40%, 0.12)`);
    bloomGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(0, 0, this.cw, this.ch);

    ctx.save();
    ctx.translate(0, this.cameraY);

    for (let i = 0; i < this.stack.length; i++) {
      const b = this.stack[i];
      if (b.y + this.cameraY < this.ch + 50 && b.y + this.cameraY > -100) {
        this.drawBlock(b);
      }
    }

    if (this.currentBlock) {
      this.drawBlock(this.currentBlock, true);
    }

    for (const p of this.slicedPieces) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }

    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();

    ctx.font = '900 48px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fillText(String(this.score), this.cw / 2, 70);

    if (this.combo > 1) {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#00FFA3';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00FFA3';
      ctx.fillText(`🔥 STREAK x${this.combo}`, this.cw / 2, 98);
    }

    ctx.restore();
  }

  private drawBlock(b: Block, isActive: boolean = false) {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(b.x + 3, b.y + 4, b.width, b.height);

    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(b.x, b.y, b.width, 3);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(b.x, b.y + b.height - 3, b.width, 3);

    if (isActive) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    }

    ctx.restore();
  }

  destroy() {
    this.running = false;
    this.timers.clearAll();
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }
}
