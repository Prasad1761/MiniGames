import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACHIEVEMENTS_LIST,
  getUnlockedAchievements,
  unlockAchievement,
} from '@/lib/progression/achievements';

describe('Achievements System', () => {
  beforeEach(() => {
    // Mock localStorage for test environment
    const store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
      length: 0,
      key: (i: number) => null,
    };
    (globalThis as any).localStorage = mockStorage;
  });

  it('contains 8 defined achievements with unique ids and descriptions', () => {
    expect(ACHIEVEMENTS_LIST.length).toBe(8);
    const ids = ACHIEVEMENTS_LIST.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(8);
  });

  it('starts with empty unlocked achievements list', () => {
    expect(getUnlockedAchievements()).toEqual([]);
  });

  it('unlocks an achievement and persists it', () => {
    const success = unlockAchievement('first_game');
    expect(success).toBe(true);

    const list = getUnlockedAchievements();
    expect(list).toContain('first_game');
  });

  it('does not duplicate previously unlocked achievement', () => {
    unlockAchievement('first_game');
    const secondTry = unlockAchievement('first_game');
    expect(secondTry).toBe(false);

    const list = getUnlockedAchievements();
    expect(list.filter((id) => id === 'first_game').length).toBe(1);
  });
});
