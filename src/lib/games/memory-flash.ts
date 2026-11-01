import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';
import { TimerManager } from '@/game-engine/core/TimerManager';

export class MemoryFlashGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private callbacks!: GameCallbacks;
  private running: boolean = false;
  private paused: boolean = false;
  private animId: number = 0;

  private timers: TimerManager = new TimerManager();

  private cw: number = 400;
  private ch: number = 600;

  private sequence: number[] = [];
  private userIndex: number = 0;
  private isShowingSequence: boolean = false;
  private activePadIndex: number | null = null;
  private score: number = 0;

  private gridSize: number = 3;
  private padColors: string[] = [
    '#00F0FF', '#00FFA3', '#FFE600',
    '#FF007A', '#A855F7', '#FF9900',
    '#00E5FF', '#3B82F6', '#EC4899',
  ];

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
    this.sequence = [];
    this.userIndex = 0;
    this.isShowingSequence = false;
    this.activePadIndex = null;

    this.callbacks.onScoreUpdate(0);
    this.addNewStep();
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

  private addNewStep() {
    const nextPad = Math.floor(Math.random() * (this.gridSize * this.gridSize));
    this.sequence.push(nextPad);
    this.playSequence();
  }

  private playSequence() {
    this.isShowingSequence = true;
    this.userIndex = 0;
    this.activePadIndex = null;

    let step = 0;

    const playNext = () => {
      if (!this.running || this.paused) return;

      if (step < this.sequence.length) {
        const pad = this.sequence[step];
        this.activePadIndex = pad;
        sound.playTap();
        triggerHaptic('light');

        this.timers.setTimeout(() => {
          this.activePadIndex = null;
          step++;
          this.timers.setTimeout(playNext, 180);
        }, 450);
      } else {
        this.isShowingSequence = false;
      }
    };

    this.timers.setTimeout(playNext, 600);
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move', clientX?: number, clientY?: number) {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running || this.paused || this.isShowingSequence || !clientX || !clientY) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const pad = this.getPadAtCoords(x, y);
    if (pad !== null) {
      this.onPadTap(pad);
    }
  }

  private getPadAtCoords(x: number, y: number): number | null {
    const padSize = (this.cw - 64) / this.gridSize;
    const gridTop = (this.ch - (padSize * this.gridSize + 24)) / 2 + 30;
    const startX = 32;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const px = startX + c * (padSize + 12);
        const py = gridTop + r * (padSize + 12);

        if (x >= px && x <= px + padSize && y >= py && y <= py + padSize) {
          return r * this.gridSize + c;
        }
      }
    }
    return null;
  }

  private onPadTap(pad: number) {
    this.activePadIndex = pad;
    this.timers.setTimeout(() => {
      if (this.activePadIndex === pad) this.activePadIndex = null;
    }, 200);

    if (pad === this.sequence[this.userIndex]) {
      sound.playPerfect(this.userIndex);
      triggerHaptic('light');
      this.userIndex++;

      if (this.userIndex === this.sequence.length) {
        this.score++;
        this.callbacks.onScoreUpdate(this.score);
        sound.playScorePing();
        this.timers.setTimeout(() => {
          this.addNewStep();
        }, 600);
      }
    } else {
      this.onFail();
    }
  }

  private onFail() {
    this.running = false;
    sound.playGameOver();
    triggerHaptic('heavy');
    this.timers.setTimeout(() => {
      this.callbacks.onGameOver(this.score, { steps: this.sequence.length });
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

    ctx.fillStyle = '#090C12';
    ctx.fillRect(0, 0, this.cw, this.ch);

    ctx.textAlign = 'center';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = this.isShowingSequence ? '#FFE600' : '#00FFA3';
    ctx.fillText(
      this.isShowingSequence ? 'MEMORIZE PATTERN...' : 'YOUR TURN — REPEAT!',
      this.cw / 2,
      70
    );

    ctx.font = '900 48px Impact, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(String(this.score), this.cw / 2, 125);

    const padSize = (this.cw - 64) / this.gridSize;
    const gridTop = (this.ch - (padSize * this.gridSize + 24)) / 2 + 30;
    const startX = 32;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const idx = r * this.gridSize + c;
        const px = startX + c * (padSize + 12);
        const py = gridTop + r * (padSize + 12);
        const isActive = this.activePadIndex === idx;

        ctx.save();
        if (isActive) {
          ctx.fillStyle = this.padColors[idx];
          ctx.shadowColor = this.padColors[idx];
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.roundRect(px - 2, py - 2, padSize + 4, padSize + 4, 16);
          ctx.fill();
        } else {
          ctx.fillStyle = '#131824';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(px, py, padSize, padSize, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = this.padColors[idx];
          ctx.beginPath();
          ctx.arc(px + padSize / 2, py + padSize / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  destroy() {
    this.running = false;
    this.timers.clearAll();
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
