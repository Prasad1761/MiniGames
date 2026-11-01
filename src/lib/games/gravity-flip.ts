import { GameCallbacks, GameInstance } from '../types';
import { sound } from '../audio';
import { triggerHaptic } from '../player';
import { PRNG } from '../prng';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike-floor' | 'spike-ceiling' | 'barrier' | 'floating';
  passed: boolean;
  nearMissAwarded: boolean;
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
}

export class GravityFlipGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private callbacks!: GameCallbacks;
  private running: boolean = false;
  private animId: number = 0;

  // Screen metrics
  private cw: number = 400;
  private ch: number = 600;

  // Corridor boundaries
  private floorY: number = 520;
  private ceilingY: number = 80;
  private corridorHeight: number = 440;

  // Player state
  private playerX: number = 90;
  private playerY: number = 500;
  private playerSize: number = 24;
  private vy: number = 0;
  private gravityDir: number = 1; // 1 = floor, -1 = ceiling
  private gravityForce: number = 0.95;
  private terminalVelocity: number = 14;
  private playerRotation: number = 0;
  private onGround: boolean = true;

  // Game progression
  private scrollSpeed: number = 6;
  private distance: number = 0;
  private score: number = 0;
  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private screenShake: number = 0;
  private prng!: PRNG;
  private nextObstacleSpawnX: number = 500;

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

    this.ceilingY = 70;
    this.floorY = this.ch - 70;
    this.corridorHeight = this.floorY - this.ceilingY;
  }

  start(seed: number = 1337) {
    this.resize();
    this.running = true;
    this.prng = new PRNG(seed);
    this.distance = 0;
    this.score = 0;
    this.scrollSpeed = 5.5;
    this.gravityDir = 1;
    this.vy = 0;
    this.playerRotation = 0;
    this.playerY = this.floorY - this.playerSize;
    this.onGround = true;
    this.obstacles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.nextObstacleSpawnX = this.cw + 200;

    this.callbacks.onScoreUpdate(0);
    this.loop();
  }

  restart(seed?: number) {
    this.destroy();
    this.start(seed ?? Math.floor(Math.random() * 100000));
  }

  handleInput(type: 'tap' | 'press' | 'release' | 'move') {
    if (type !== 'tap' && type !== 'press') return;
    if (!this.running) return;

    this.flipGravity();
  }

  private flipGravity() {
    // Flip direction!
    this.gravityDir *= -1;
    this.vy = this.gravityDir * 4.5; // Initial push
    this.onGround = false;

    sound.playGravityFlip();
    triggerHaptic('light');

    // Trail burst
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.playerX + this.playerSize / 2,
        y: this.playerY + this.playerSize / 2,
        vx: -this.scrollSpeed * 0.4 + (Math.random() - 0.5) * 3,
        vy: -this.gravityDir * (1 + Math.random() * 3),
        color: '#00F0FF',
        size: 3 + Math.random() * 3,
        alpha: 0.9,
      });
    }
  }

  private loop = () => {
    if (!this.ctx) return;
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(this.loop);
  };

  private update() {
    if (!this.running) return;

    // Shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }

    // Advance speed & distance
    this.scrollSpeed = Math.min(5.5 + this.score * 0.04, 11);
    this.distance += this.scrollSpeed;
    const currentMeters = Math.floor(this.distance / 25);
    if (currentMeters > this.score) {
      this.score = currentMeters;
      this.callbacks.onScoreUpdate(this.score);
    }

    // Apply gravity
    this.vy += this.gravityForce * this.gravityDir;
    if (Math.abs(this.vy) > this.terminalVelocity) {
      this.vy = Math.sign(this.vy) * this.terminalVelocity;
    }
    this.playerY += this.vy;

    // Floor collision
    if (this.gravityDir === 1 && this.playerY >= this.floorY - this.playerSize) {
      this.playerY = this.floorY - this.playerSize;
      this.vy = 0;
      this.onGround = true;
      this.playerRotation = 0;
    }
    // Ceiling collision
    else if (this.gravityDir === -1 && this.playerY <= this.ceilingY) {
      this.playerY = this.ceilingY;
      this.vy = 0;
      this.onGround = true;
      this.playerRotation = Math.PI;
    } else {
      this.onGround = false;
      this.playerRotation += this.gravityDir * 0.12;
    }

    // Player running particle trail
    if (Math.random() > 0.3) {
      this.particles.push({
        x: this.playerX,
        y: this.playerY + (this.gravityDir === 1 ? this.playerSize - 2 : 2),
        vx: -this.scrollSpeed * 0.7 + (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: this.onGround ? '#00FFA3' : '#00F0FF',
        size: 2.5 + Math.random() * 2.5,
        alpha: 0.8,
      });
    }

    // Spawn obstacles
    if (this.nextObstacleSpawnX <= this.cw + 100) {
      this.spawnProceduralObstacle();
    }
    this.nextObstacleSpawnX -= this.scrollSpeed;

    // Update and collide obstacles
    const playerBox = {
      x: this.playerX + 3,
      y: this.playerY + 3,
      width: this.playerSize - 6,
      height: this.playerSize - 6,
    };

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.scrollSpeed;

      // Check collision
      const collides =
        playerBox.x < obs.x + obs.width &&
        playerBox.x + playerBox.width > obs.x &&
        playerBox.y < obs.y + obs.height &&
        playerBox.y + playerBox.height > obs.y;

      if (collides) {
        this.onCrash();
        return;
      }

      // Near-miss detection (bonus points!)
      if (!obs.nearMissAwarded && obs.x + obs.width < this.playerX) {
        const distY = Math.abs(this.playerY - obs.y);
        if (distY < 45) {
          obs.nearMissAwarded = true;
          this.score += 3;
          this.callbacks.onScoreUpdate(this.score);
          sound.playScorePing();
          this.floatingTexts.push({
            text: '+3 NEAR MISS!',
            x: this.playerX + 20,
            y: this.playerY,
            color: '#FFE600',
            alpha: 1,
          });
        }
      }

      // Cleanup
      if (obs.x + obs.width < -50) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      p.size *= 0.96;
      if (p.alpha <= 0 || p.size <= 0.4) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private spawnProceduralObstacle() {
    const types: ('spike-floor' | 'spike-ceiling' | 'barrier')[] = [
      'spike-floor',
      'spike-ceiling',
      'barrier',
    ];
    const chosen = this.prng.pick(types);

    const spawnX = this.cw + 40;
    const spikeWidth = 26;
    const spikeHeight = 32;

    if (chosen === 'spike-floor') {
      this.obstacles.push({
        x: spawnX,
        y: this.floorY - spikeHeight,
        width: spikeWidth,
        height: spikeHeight,
        type: 'spike-floor',
        passed: false,
        nearMissAwarded: false,
      });
    } else if (chosen === 'spike-ceiling') {
      this.obstacles.push({
        x: spawnX,
        y: this.ceilingY,
        width: spikeWidth,
        height: spikeHeight,
        type: 'spike-ceiling',
        passed: false,
        nearMissAwarded: false,
      });
    } else {
      // Floating laser barrier in middle
      const barrierH = 55;
      const barrierY = this.ceilingY + (this.corridorHeight - barrierH) / 2;
      this.obstacles.push({
        x: spawnX,
        y: barrierY,
        width: 22,
        height: barrierH,
        type: 'barrier',
        passed: false,
        nearMissAwarded: false,
      });
    }

    // Spacing between obstacles
    const minSpacing = Math.max(160, 280 - this.score * 1.5);
    const maxSpacing = Math.max(220, 380 - this.score * 1.5);
    this.nextObstacleSpawnX = spawnX + this.prng.range(minSpacing, maxSpacing);
  }

  private onCrash() {
    this.running = false;
    sound.playGameOver();
    triggerHaptic('heavy');
    this.screenShake = 16;

    // Shatter player into shards
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      this.particles.push({
        x: this.playerX + this.playerSize / 2,
        y: this.playerY + this.playerSize / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? '#00FFA3' : '#FF007A',
        size: 3 + Math.random() * 4,
        alpha: 1,
      });
    }

    setTimeout(() => {
      this.callbacks.onGameOver(this.score, {
        distance: Math.floor(this.distance),
        speed: this.scrollSpeed.toFixed(1),
      });
    }, 700);
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);

    ctx.save();

    // Screen shake
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    // Corridor Background
    const bgGrad = ctx.createLinearGradient(0, this.ceilingY, 0, this.floorY);
    bgGrad.addColorStop(0, '#0a0d15');
    bgGrad.addColorStop(0.5, '#0e1320');
    bgGrad.addColorStop(1, '#0a0d15');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.cw, this.ch);

    // Corridor top/bottom boundaries (Neon Rails)
    ctx.fillStyle = '#171d2b';
    ctx.fillRect(0, 0, this.cw, this.ceilingY);
    ctx.fillRect(0, this.floorY, this.cw, this.ch - this.floorY);

    // Top neon rail
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.ceilingY);
    ctx.lineTo(this.cw, this.ceilingY);
    ctx.stroke();

    // Bottom neon rail
    ctx.strokeStyle = '#00FFA3';
    ctx.beginPath();
    ctx.moveTo(0, this.floorY);
    ctx.lineTo(this.cw, this.floorY);
    ctx.stroke();

    // Background scrolling grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridOffset = -(this.distance % 40);
    for (let x = gridOffset; x < this.cw; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, this.ceilingY);
      ctx.lineTo(x, this.floorY);
      ctx.stroke();
    }

    // Draw Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    }

    // Draw Obstacles
    for (const obs of this.obstacles) {
      ctx.save();
      if (obs.type === 'spike-floor') {
        // Neon red/pink triangle spike pointing up
        ctx.fillStyle = '#FF007A';
        ctx.shadowColor = '#FF007A';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
      } else if (obs.type === 'spike-ceiling') {
        // Spike pointing down
        ctx.fillStyle = '#FF007A';
        ctx.shadowColor = '#FF007A';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width, obs.y);
        ctx.closePath();
        ctx.fill();
      } else {
        // Glowing laser barrier
        ctx.fillStyle = '#FFE600';
        ctx.shadowColor = '#FFE600';
        ctx.shadowBlur = 10;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Core line
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(obs.x + 8, obs.y, 6, obs.height);
      }
      ctx.restore();
    }

    // Draw Player (if still alive)
    if (this.running) {
      ctx.save();
      ctx.translate(this.playerX + this.playerSize / 2, this.playerY + this.playerSize / 2);
      ctx.rotate(this.playerRotation);

      // Neon body
      ctx.fillStyle = '#00FFA3';
      ctx.shadowColor = '#00FFA3';
      ctx.shadowBlur = 12;
      ctx.fillRect(-this.playerSize / 2, -this.playerSize / 2, this.playerSize, this.playerSize);

      // Inner core
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-this.playerSize / 4, -this.playerSize / 4, this.playerSize / 2, this.playerSize / 2);

      ctx.restore();
    }

    // Draw Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore(); // Undo shake

    // Score HUD
    ctx.font = '900 44px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 255, 163, 0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText(`${this.score}m`, this.cw / 2, 50);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`TAP TO FLIP GRAVITY`, this.cw / 2, this.ch - 30);
  }

  destroy() {
    this.running = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }
}
