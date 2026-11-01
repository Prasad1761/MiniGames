import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';
import { TimerManager } from '@/game-engine/core/TimerManager';

interface GridTile {
  row: number;
  col: number;
  type: 'safe' | 'danger';
  tapped: boolean;
}

export class DontTapRedGame implements GameInstance {
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

  private numCols: number = 4;
  private rowHeight: number = 135;
  private scrollY: number = 0;
  private speed: number = 3.2;
  private score: number = 0;
  private combo: number = 0;
  private nextRowIndex: number = 0;
  private rows: { rowIndex: number; tiles: GridTile[] }[] = [];
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
    this.speed = 3.2;
    this.scrollY = 0;
    this.rows = [];
    this.nextRowIndex = 0;
    this.screenShake = 0;

    for (let r = 0; r < 6; r++) {
      this.spawnRow();
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

  private spawnRow() {
    const safeCol = Math.floor(Math.random() * this.numCols);
    const dangerCol = Math.random() > 0.4 ? (safeCol + 1 + Math.floor(Math.random() * (this.numCols - 1))) % this.numCols : -1;

    const tiles: GridTile[] = [];
    for (let c = 0; c < this.numCols; c++) {
      if (c === safeCol) {
        tiles.push({ row: this.nextRowIndex, col: c, type: 'safe', tapped: false });
      } else if (c === dangerCol) {
        tiles.push({ row: this.nextRowIndex, col: c, type: 'danger', tapped: false });
      }
    }

    this.rows.push({
      rowIndex: this.nextRowIndex,
      tiles,
    });
    this.nextRowIndex++;
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move', clientX?: number, clientY?: number) {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running || this.paused || !clientX || !clientY) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const colW = this.cw / this.numCols;
    const clickedCol = Math.floor(x / colW);

    for (const r of this.rows) {
      const rowY = this.ch - (r.rowIndex * this.rowHeight - this.scrollY);
      if (y >= rowY - this.rowHeight && y <= rowY) {
        const clickedTile = r.tiles.find((t) => t.col === clickedCol);
        if (clickedTile) {
          if (clickedTile.type === 'safe' && !clickedTile.tapped) {
            clickedTile.tapped = true;
            this.score++;
            this.combo++;
            sound.playPerfect(this.combo);
            triggerHaptic('light');
            this.callbacks.onScoreUpdate(this.score);
            this.speed = Math.min(3.2 + this.score * 0.08, 9.5);
          } else if (clickedTile.type === 'danger') {
            this.onFail('TAPPED RED TILE!');
          }
        }
        break;
      }
    }
  }

  private onFail(reason: string) {
    this.running = false;
    sound.playGameOver();
    triggerHaptic('heavy');
    this.screenShake = 15;

    this.timers.setTimeout(() => {
      this.callbacks.onGameOver(this.score, { combo: this.combo, reason });
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
    this.scrollY += this.speed * dt;

    if (this.rows.length > 0) {
      const bottomRow = this.rows[0];
      const bottomRowY = this.ch - (bottomRow.rowIndex * this.rowHeight - this.scrollY);

      if (bottomRowY > this.ch + this.rowHeight) {
        const missedSafe = bottomRow.tiles.some((t) => t.type === 'safe' && !t.tapped);
        if (missedSafe) {
          this.onFail('SAFE TILE MISSED!');
          return;
        }
        this.rows.shift();
      }
    }

    const topRow = this.rows[this.rows.length - 1];
    const topRowY = this.ch - (topRow.rowIndex * this.rowHeight - this.scrollY);
    if (topRowY > -100) {
      this.spawnRow();
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

    ctx.fillStyle = '#080A10';
    ctx.fillRect(0, 0, this.cw, this.ch);

    const colW = this.cw / this.numCols;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let c = 1; c < this.numCols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * colW, 0);
      ctx.lineTo(c * colW, this.ch);
      ctx.stroke();
    }

    for (const r of this.rows) {
      const rowY = this.ch - (r.rowIndex * this.rowHeight - this.scrollY);
      if (rowY < -100 || rowY > this.ch + 150) continue;

      for (const t of r.tiles) {
        const tx = t.col * colW;
        const ty = rowY - this.rowHeight;

        if (t.type === 'safe') {
          if (t.tapped) {
            ctx.fillStyle = 'rgba(0, 255, 163, 0.2)';
            ctx.fillRect(tx + 2, ty + 2, colW - 4, this.rowHeight - 4);
          } else {
            ctx.fillStyle = '#00FFA3';
            ctx.shadowColor = '#00FFA3';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(tx + 4, ty + 4, colW - 8, this.rowHeight - 8, 8);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(tx + 8, ty + 8, colW - 16, 6);
            ctx.shadowBlur = 0;
          }
        } else if (t.type === 'danger') {
          ctx.fillStyle = '#FF0055';
          ctx.shadowColor = '#FF0055';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(tx + 4, ty + 4, colW - 8, this.rowHeight - 8, 8);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💣', tx + colW / 2, ty + this.rowHeight / 2 + 8);
        }
      }
    }

    ctx.restore();

    ctx.font = '900 48px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(String(this.score), this.cw / 2, 65);
  }

  destroy() {
    this.running = false;
    this.timers.clearAll();
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
