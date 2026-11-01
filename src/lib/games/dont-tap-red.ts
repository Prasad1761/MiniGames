import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';

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
  private animId: number = 0;

  private cw: number = 400;
  private ch: number = 600;

  private numCols: number = 4;
  private rowHeight: number = 135;
  private scrollY: number = 0;
  private speed: number = 3.5;
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
    this.resize();
    this.running = true;
    this.score = 0;
    this.combo = 0;
    this.speed = 3.2;
    this.scrollY = 0;
    this.rows = [];
    this.nextRowIndex = 0;
    this.screenShake = 0;

    // Spawn initial 6 rows
    for (let r = 0; r < 6; r++) {
      this.spawnRow();
    }

    this.callbacks.onScoreUpdate(0);
    this.loop();
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
    if (!this.running || !clientX || !clientY) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const colW = this.cw / this.numCols;
    const clickedCol = Math.floor(x / colW);

    // Find tile that intersects clicked Y
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

    setTimeout(() => {
      this.callbacks.onGameOver(this.score, { combo: this.combo, reason });
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

    this.scrollY += this.speed;

    // Check if bottommost row has passed off screen
    if (this.rows.length > 0) {
      const bottomRow = this.rows[0];
      const bottomRowY = this.ch - (bottomRow.rowIndex * this.rowHeight - this.scrollY);

      if (bottomRowY > this.ch + this.rowHeight) {
        // Did player miss a safe tile in this row?
        const missedSafe = bottomRow.tiles.some((t) => t.type === 'safe' && !t.tapped);
        if (missedSafe) {
          this.onFail('SAFE TILE MISSED!');
          return;
        }
        this.rows.shift();
      }
    }

    // Spawn more rows at top
    const topRow = this.rows[this.rows.length - 1];
    const topRowY = this.ch - (topRow.rowIndex * this.rowHeight - this.scrollY);
    if (topRowY > -100) {
      this.spawnRow();
    }

    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
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

    // Background
    ctx.fillStyle = '#080A10';
    ctx.fillRect(0, 0, this.cw, this.ch);

    const colW = this.cw / this.numCols;

    // Draw Column Dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let c = 1; c < this.numCols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * colW, 0);
      ctx.lineTo(c * colW, this.ch);
      ctx.stroke();
    }

    // Draw Rows & Tiles
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

            // Inner gloss
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(tx + 8, ty + 8, colW - 16, 6);
            ctx.shadowBlur = 0;
          }
        } else if (t.type === 'danger') {
          // Red bomb tile
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

    // HUD
    ctx.font = '900 48px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(String(this.score), this.cw / 2, 65);
  }

  destroy() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
