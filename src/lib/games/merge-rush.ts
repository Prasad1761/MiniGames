import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';

interface Tile {
  val: number;
}

export class MergeRushGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private callbacks!: GameCallbacks;
  private running: boolean = false;
  private animId: number = 0;

  private cw: number = 400;
  private ch: number = 600;

  private cols: number = 4;
  private rows: number = 6;
  private grid: (Tile | null)[][] = [];
  private nextVal: number = 2;
  private score: number = 0;

  private tileColors: Record<number, string> = {
    2: '#3B82F6',
    4: '#00F0FF',
    8: '#00FFA3',
    16: '#FFE600',
    32: '#FF9900',
    64: '#FF007A',
    128: '#A855F7',
    256: '#EC4899',
    512: '#10B981',
    1024: '#F59E0B',
    2048: '#E11D48',
  };

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
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    this.spawnNextVal();

    this.callbacks.onScoreUpdate(0);
    this.loop();
  }

  restart(seed?: number) {
    this.destroy();
    this.start(seed);
  }

  private spawnNextVal() {
    const opts = [2, 4, 8];
    if (this.score > 200) opts.push(16);
    this.nextVal = opts[Math.floor(Math.random() * opts.length)];
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move', clientX?: number, clientY?: number) {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running || !clientX || !clientY) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;

    const colW = (this.cw - 32) / this.cols;
    const col = Math.floor((x - 16) / colW);

    if (col >= 0 && col < this.cols) {
      this.dropIntoColumn(col);
    }
  }

  private dropIntoColumn(col: number) {
    // Find bottom-most empty slot in this column
    let targetRow = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (!this.grid[r][col]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      // Column overflow: Game Over!
      this.running = false;
      sound.playGameOver();
      triggerHaptic('heavy');
      setTimeout(() => {
        this.callbacks.onGameOver(this.score);
      }, 700);
      return;
    }

    // Place tile
    this.grid[targetRow][col] = { val: this.nextVal };
    sound.playTap();
    triggerHaptic('light');

    // Run merge cascades
    this.checkMerges(targetRow, col);
    this.spawnNextVal();
  }

  private checkMerges(r: number, c: number) {
    const current = this.grid[r][c];
    if (!current) return;

    // Check below
    if (r + 1 < this.rows && this.grid[r + 1][c]?.val === current.val) {
      this.mergeTiles(r, c, r + 1, c);
      return;
    }

    // Check left
    if (c > 0 && this.grid[r][c - 1]?.val === current.val) {
      this.mergeTiles(r, c, r, c - 1);
      return;
    }

    // Check right
    if (c + 1 < this.cols && this.grid[r][c + 1]?.val === current.val) {
      this.mergeTiles(r, c, r, c + 1);
      return;
    }
  }

  private mergeTiles(r1: number, c1: number, r2: number, c2: number) {
    const newVal = this.grid[r1][c1]!.val * 2;
    this.grid[r1][c1] = null;
    this.grid[r2][c2] = { val: newVal };

    this.score += newVal;
    this.callbacks.onScoreUpdate(this.score);
    sound.playPerfect(Math.min(7, Math.floor(Math.log2(newVal))));
    triggerHaptic('medium');

    // Gravity pull down for empty slots
    this.applyGravity();

    // Check if new position can cascade merge
    this.checkMerges(r2, c2);
  }

  private applyGravity() {
    for (let c = 0; c < this.cols; c++) {
      for (let r = this.rows - 1; r > 0; r--) {
        if (!this.grid[r][c]) {
          // Find first tile above
          for (let above = r - 1; above >= 0; above--) {
            if (this.grid[above][c]) {
              this.grid[r][c] = this.grid[above][c];
              this.grid[above][c] = null;
              break;
            }
          }
        }
      }
    }
  }

  private loop = () => {
    if (!this.ctx) return;
    this.draw();
    this.animId = requestAnimationFrame(this.loop);
  };

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    ctx.fillStyle = '#080A10';
    ctx.fillRect(0, 0, this.cw, this.ch);

    // Score HUD
    ctx.textAlign = 'center';
    ctx.font = '900 44px Impact, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(String(this.score), this.cw / 2, 60);

    // Incoming tile preview at top
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('NEXT TILE:', this.cw / 2, 90);

    const previewSize = 42;
    ctx.fillStyle = this.tileColors[this.nextVal] || '#3B82F6';
    ctx.beginPath();
    ctx.roundRect(this.cw / 2 - previewSize / 2, 100, previewSize, previewSize, 10);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 18px Impact, sans-serif';
    ctx.fillText(String(this.nextVal), this.cw / 2, 126);

    // Draw Grid
    const startX = 16;
    const startY = 160;
    const colW = (this.cw - 32) / this.cols;
    const rowH = 68;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = startX + c * colW;
        const y = startY + r * rowH;
        const tile = this.grid[r][c];

        ctx.fillStyle = '#111520';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, colW - 6, rowH - 6, 12);
        ctx.fill();
        ctx.stroke();

        if (tile) {
          ctx.fillStyle = this.tileColors[tile.val] || '#3B82F6';
          ctx.beginPath();
          ctx.roundRect(x + 4, y + 4, colW - 8, rowH - 8, 10);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.font = '900 24px Impact, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(tile.val), x + colW / 2, y + rowH / 2 + 8);
        }
      }
    }
  }

  destroy() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
