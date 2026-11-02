import { describe, it, expect } from 'vitest';
import { GameLoop } from '@/game-engine/core/GameLoop';

describe('GameLoop Delta-Time Normalization', () => {
  it('should initialize in stopped and unpaused state', () => {
    const loop = new GameLoop(() => {}, () => {});
    expect(loop.isRunning()).toBe(false);
    expect(loop.isPaused()).toBe(false);
  });

  it('should toggle pause state correctly', () => {
    const loop = new GameLoop(() => {}, () => {});
    loop.start();
    expect(loop.isPaused()).toBe(false);

    loop.pause();
    expect(loop.isPaused()).toBe(true);

    loop.resume();
    expect(loop.isPaused()).toBe(false);
    loop.stop();
  });
});
