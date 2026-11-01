import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';

type ReactionState = 'READY' | 'WAITING' | 'CLICK_NOW' | 'TOO_EARLY' | 'RESULT';

export class ReactionTestGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private callbacks!: GameCallbacks;
  private running: boolean = false;
  private animId: number = 0;

  private state: ReactionState = 'READY';
  private timerId: any = null;
  private startTime: number = 0;
  private reactionTimeMs: number = 0;
  private rounds: number[] = [];
  private maxRounds: number = 5;

  private cw: number = 400;
  private ch: number = 600;
  private rippleRadius: number = 0;
  private rippleAlpha: number = 0;

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
    this.rounds = [];
    this.state = 'READY';
    this.reactionTimeMs = 0;
    this.callbacks.onScoreUpdate(0);
    this.loop();
  }

  restart(seed?: number) {
    this.destroy();
    this.start(seed);
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move') {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running) return;

    this.onUserTap();
  }

  private onUserTap() {
    const now = performance.now();

    switch (this.state) {
      case 'READY':
        // Start waiting
        this.armReactionTimer();
        break;

      case 'WAITING':
        // Tapped too early!
        if (this.timerId) clearTimeout(this.timerId);
        this.state = 'TOO_EARLY';
        sound.playReactionBeep('early');
        triggerHaptic('error');
        break;

      case 'CLICK_NOW':
        // Successful reaction!
        this.reactionTimeMs = Math.round(now - this.startTime);
        this.rounds.push(this.reactionTimeMs);
        this.state = 'RESULT';
        sound.playReactionBeep('go');
        triggerHaptic('success');

        this.rippleRadius = 10;
        this.rippleAlpha = 1;

        // Score in reaction test is the ms (lower is better)
        this.callbacks.onScoreUpdate(this.reactionTimeMs);

        // If completed 5 rounds or single test
        if (this.rounds.length >= this.maxRounds) {
          const avg = Math.round(this.rounds.reduce((a, b) => a + b, 0) / this.rounds.length);
          const best = Math.min(...this.rounds);
          setTimeout(() => {
            this.callbacks.onGameOver(best, {
              average: avg,
              rounds: this.rounds,
              rating: this.getRating(best).title,
            });
          }, 800);
        }
        break;

      case 'TOO_EARLY':
        // Retry current attempt
        this.armReactionTimer();
        break;

      case 'RESULT':
        if (this.rounds.length < this.maxRounds) {
          this.armReactionTimer();
        } else {
          // Restart full set
          this.rounds = [];
          this.armReactionTimer();
        }
        break;
    }
  }

  private armReactionTimer() {
    this.state = 'WAITING';
    sound.playReactionBeep('wait');
    triggerHaptic('light');

    // Random wait between 1.4s and 4.2s
    const delay = 1400 + Math.random() * 2800;
    if (this.timerId) clearTimeout(this.timerId);

    this.timerId = setTimeout(() => {
      if (this.state === 'WAITING') {
        this.state = 'CLICK_NOW';
        this.startTime = performance.now();
        sound.playReactionBeep('go');
        triggerHaptic('heavy');
      }
    }, delay);
  }

  private getRating(ms: number): { title: string; subtitle: string; color: string } {
    if (ms < 180) {
      return { title: 'GODLIKE SPEED', subtitle: 'Faster than 99.8% of humans', color: '#00FFA3' };
    } else if (ms < 220) {
      return { title: 'CYBERNETIC', subtitle: 'Pro esports level reflexes', color: '#00F0FF' };
    } else if (ms < 260) {
      return { title: 'LIGHTNING FAST', subtitle: 'Well above average', color: '#FFE600' };
    } else if (ms < 320) {
      return { title: 'SOLID AVERAGE', subtitle: 'Typical human reaction', color: '#FF9900' };
    } else {
      return { title: 'NEEDS PRACTICE', subtitle: 'Stay focused and retry!', color: '#FF007A' };
    }
  }

  private loop = () => {
    if (!this.ctx) return;
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(this.loop);
  };

  private update() {
    if (this.rippleAlpha > 0) {
      this.rippleRadius += 12;
      this.rippleAlpha -= 0.03;
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    let bgColor = '#0B0E14';
    let title = '';
    let subtitle = '';
    let icon = '';

    switch (this.state) {
      case 'READY':
        bgColor = '#111622';
        title = 'TAP TO BEGIN';
        subtitle = 'When the screen turns green, tap as fast as you can!';
        icon = '⚡';
        break;
      case 'WAITING':
        bgColor = '#C92A2A'; // Red warning
        title = 'WAIT FOR GREEN...';
        subtitle = 'Do NOT tap yet!';
        icon = '🛑';
        break;
      case 'CLICK_NOW':
        bgColor = '#00C853'; // Flash vibrant green!
        title = 'TAP NOW!';
        subtitle = 'FAST AS YOU CAN!';
        icon = '🟢';
        break;
      case 'TOO_EARLY':
        bgColor = '#E67700'; // Amber warning
        title = 'TOO SOON!';
        subtitle = 'You tapped before green. Tap to try again.';
        icon = '⚠️';
        break;
      case 'RESULT':
        bgColor = '#151A23';
        const rating = this.getRating(this.reactionTimeMs);
        title = `${this.reactionTimeMs} ms`;
        subtitle = `${rating.title} — ${rating.subtitle}`;
        icon = '🎯';
        break;
    }

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.cw, this.ch);

    // Ripple effect on tap
    if (this.rippleAlpha > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.rippleAlpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.cw / 2, this.ch / 2, this.rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw center iconography & typography
    ctx.save();
    ctx.textAlign = 'center';

    // Emoji / Icon
    ctx.font = '64px sans-serif';
    ctx.fillText(icon, this.cw / 2, this.ch / 2 - 50);

    // Main Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Impact, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(title, this.cw / 2, this.ch / 2 + 30);

    // Subtitle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(subtitle, this.cw / 2, this.ch / 2 + 75);

    // Round counter and history at bottom
    if (this.rounds.length > 0) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(
        `Round ${Math.min(this.rounds.length + 1, this.maxRounds)} of ${this.maxRounds}`,
        this.cw / 2,
        this.ch - 60
      );

      // Render dots for rounds
      const startX = this.cw / 2 - (this.maxRounds * 20) / 2 + 10;
      for (let i = 0; i < this.maxRounds; i++) {
        ctx.beginPath();
        ctx.arc(startX + i * 20, this.ch - 35, 6, 0, Math.PI * 2);
        if (i < this.rounds.length) {
          ctx.fillStyle = '#00FFA3';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        }
        ctx.fill();
      }
    }

    ctx.restore();
  }

  destroy() {
    this.running = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }
}
