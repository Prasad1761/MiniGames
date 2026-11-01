import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';

interface ColorDef {
  name: string;
  hex: string;
}

const PALETTE: ColorDef[] = [
  { name: 'RED', hex: '#FF2A55' },
  { name: 'BLUE', hex: '#00A2FF' },
  { name: 'GREEN', hex: '#00FFA3' },
  { name: 'YELLOW', hex: '#FFE600' },
  { name: 'PURPLE', hex: '#B537F2' },
  { name: 'CYAN', hex: '#00F0FF' },
];

interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  color: ColorDef;
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

export class ColorPanicGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private callbacks!: GameCallbacks;
  private running: boolean = false;
  private animId: number = 0;

  private cw: number = 400;
  private ch: number = 600;

  private score: number = 0;
  private combo: number = 0;
  private timer: number = 1.0; // 0.0 to 1.0
  private maxTimeMs: number = 2400;
  private lastTimestamp: number = 0;

  // Target challenge state
  private ruleType: 'TEXT_COLOR' | 'WORD_MEANING' = 'TEXT_COLOR';
  private targetWord: ColorDef = PALETTE[0];
  private targetTextColor: ColorDef = PALETTE[1];
  private tiles: Tile[] = [];
  private particles: Particle[] = [];
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
    this.resize();
    this.running = true;
    this.score = 0;
    this.combo = 0;
    this.timer = 1.0;
    this.maxTimeMs = 2500;
    this.particles = [];
    this.screenShake = 0;
    this.lastTimestamp = performance.now();

    this.callbacks.onScoreUpdate(0);
    this.nextRound();
    this.loop();
  }

  restart(seed?: number) {
    this.destroy();
    this.start(seed);
  }

  private nextRound() {
    this.timer = 1.0;
    this.maxTimeMs = Math.max(1200, 2400 - this.score * 35);

    // Pick rule: 65% match font color (Stroop tricky), 35% match word name
    this.ruleType = Math.random() > 0.35 ? 'TEXT_COLOR' : 'WORD_MEANING';

    // Pick word and ink color (ensure they are different for Stroop effect)
    const shuffled = [...PALETTE].sort(() => Math.random() - 0.5);
    this.targetWord = shuffled[0];
    this.targetTextColor = shuffled[1];

    const correctColor = this.ruleType === 'TEXT_COLOR' ? this.targetTextColor : this.targetWord;

    // Pick 4 options including correct one
    const decoyColors = PALETTE.filter((c) => c.name !== correctColor.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const roundColors = [correctColor, ...decoyColors].sort(() => Math.random() - 0.5);

    // Layout 2x2 grid of tiles
    const padding = 16;
    const gridTop = this.ch * 0.46;
    const tileW = (this.cw - padding * 3) / 2;
    const tileH = (this.ch - gridTop - padding * 3);
    const singleTileH = (tileH - padding) / 2;

    this.tiles = [
      { x: padding, y: gridTop, width: tileW, height: singleTileH, color: roundColors[0] },
      { x: padding * 2 + tileW, y: gridTop, width: tileW, height: singleTileH, color: roundColors[1] },
      { x: padding, y: gridTop + singleTileH + padding, width: tileW, height: singleTileH, color: roundColors[2] },
      { x: padding * 2 + tileW, y: gridTop + singleTileH + padding, width: tileW, height: singleTileH, color: roundColors[3] },
    ];
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move', clientX?: number, clientY?: number) {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running || !clientX || !clientY) return;

    // Convert client coords to canvas local coords
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (const tile of this.tiles) {
      if (x >= tile.x && x <= tile.x + tile.width && y >= tile.y && y <= tile.y + tile.height) {
        this.onTileTap(tile);
        return;
      }
    }
  }

  private onTileTap(tile: Tile) {
    const correctColor = this.ruleType === 'TEXT_COLOR' ? this.targetTextColor : this.targetWord;

    if (tile.color.name === correctColor.name) {
      // Correct!
      this.score++;
      this.combo++;
      sound.playPerfect(this.combo);
      triggerHaptic('light');

      // Sparks
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        this.particles.push({
          x: tile.x + tile.width / 2,
          y: tile.y + tile.height / 2,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: tile.color.hex,
          size: 3 + Math.random() * 3,
          alpha: 1,
        });
      }

      this.callbacks.onScoreUpdate(this.score);
      this.nextRound();
    } else {
      // Wrong tile!
      this.onFail();
    }
  }

  private onFail() {
    this.running = false;
    sound.playGameOver();
    triggerHaptic('heavy');
    this.screenShake = 14;

    setTimeout(() => {
      this.callbacks.onGameOver(this.score, { combo: this.combo });
    }, 700);
  }

  private loop = () => {
    if (!this.ctx) return;
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(this.loop);
  };

  private update() {
    if (!this.running) return;

    const now = performance.now();
    const dt = now - this.lastTimestamp;
    this.lastTimestamp = now;

    // Timer countdown
    this.timer -= dt / this.maxTimeMs;
    if (this.timer <= 0) {
      this.timer = 0;
      this.onFail();
      return;
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      p.size *= 0.95;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    ctx.save();
    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    // Background
    ctx.fillStyle = '#090C12';
    ctx.fillRect(0, 0, this.cw, this.ch);

    // Timer Fuse Bar at very top
    const timerW = this.cw * Math.max(0, this.timer);
    ctx.fillStyle = this.timer > 0.4 ? '#00FFA3' : '#FF007A';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fillRect(0, 0, timerW, 8);
    ctx.shadowBlur = 0;

    // Score HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${this.score}  •  STREAK: x${this.combo}`, this.cw / 2, 45);

    // Rule Instruction Card
    const ruleText =
      this.ruleType === 'TEXT_COLOR'
        ? 'TAP THE COLOR OF THIS TEXT:'
        : 'TAP THE MEANING OF THIS WORD:';

    ctx.font = '900 13px sans-serif';
    ctx.fillStyle = this.ruleType === 'TEXT_COLOR' ? '#00F0FF' : '#FFE600';
    ctx.fillText(ruleText, this.cw / 2, 95);

    // Big Stroop Word Challenge Display
    ctx.font = '900 52px Impact, sans-serif';
    ctx.fillStyle = this.targetTextColor.hex;
    ctx.shadowColor = this.targetTextColor.hex;
    ctx.shadowBlur = 14;
    ctx.fillText(this.targetWord.name, this.cw / 2, 175);
    ctx.shadowBlur = 0;

    // Subtitle hint
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText('Do not be deceived by the word!', this.cw / 2, 225);

    // Draw Colored Tap Tiles
    for (const t of this.tiles) {
      ctx.save();
      // Tile background
      ctx.fillStyle = t.color.hex;
      ctx.shadowColor = t.color.hex;
      ctx.shadowBlur = 12;

      // Rounded rect
      const r = 20;
      ctx.beginPath();
      ctx.roundRect(t.x, t.y, t.width, t.height, r);
      ctx.fill();

      // Top glass sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(t.x, t.y, t.width, t.height / 2, [r, r, 0, 0]);
      ctx.fill();

      // Tile Color Name
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000000';
      ctx.font = '900 20px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.color.name, t.x + t.width / 2, t.y + t.height / 2 + 7);

      ctx.restore();
    }

    // Draw Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  destroy() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
