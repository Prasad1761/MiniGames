import { describe, it, expect } from 'vitest';
import { GAMES_CATALOG, getGameById, createGameInstance } from '@/lib/games/registry';

describe('Game Registry', () => {
  it('registers all 10 mini-games', () => {
    expect(GAMES_CATALOG.length).toBe(10);
  });

  it('contains expected game ids', () => {
    const ids = GAMES_CATALOG.map((g) => g.id);
    expect(ids).toContain('perfect-stack');
    expect(ids).toContain('reaction-test');
    expect(ids).toContain('gravity-flip');
    expect(ids).toContain('color-panic');
    expect(ids).toContain('one-more-jump');
    expect(ids).toContain('dont-tap-red');
    expect(ids).toContain('memory-flash');
    expect(ids).toContain('perfect-timing');
    expect(ids).toContain('merge-rush');
    expect(ids).toContain('impossible-maze');
  });

  it('can create a game instance for every registered game', () => {
    for (const meta of GAMES_CATALOG) {
      const instance = createGameInstance(meta.id);
      expect(instance).toBeDefined();
      expect(typeof instance.init).toBe('function');
      expect(typeof instance.start).toBe('function');
      expect(typeof instance.handleInput).toBe('function');
      expect(typeof instance.destroy).toBe('function');
      instance.destroy();
    }
  });

  it('retrieves game metadata by id correctly', () => {
    const stack = getGameById('perfect-stack');
    expect(stack).toBeDefined();
    expect(stack?.title).toBe('Perfect Stack');
    expect(stack?.category).toBe('precision');
  });
});
