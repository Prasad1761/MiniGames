// Player Achievements and Progression System

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'skill' | 'daily' | 'social';
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_game',
    title: 'Coin Inserted',
    description: 'Play your very first arcade round',
    icon: '🪙',
    category: 'milestone',
  },
  {
    id: 'five_games',
    title: 'Arcade Regular',
    description: 'Play 5 total rounds across any game',
    icon: '🕹️',
    category: 'milestone',
  },
  {
    id: 'twenty_games',
    title: 'Arcade Veteran',
    description: 'Play 20 total rounds',
    icon: '👑',
    category: 'milestone',
  },
  {
    id: 'stack_pro',
    title: 'Skyscraper Builder',
    description: 'Reach 20+ blocks in Perfect Stack',
    icon: '🏗️',
    category: 'skill',
  },
  {
    id: 'reflex_fast',
    title: 'Cyber Reflexes',
    description: 'Achieve under 220ms in Reaction Test',
    icon: '⚡',
    category: 'skill',
  },
  {
    id: 'gravity_150',
    title: 'Orbit Breaker',
    description: 'Travel over 150m in Gravity Flip',
    icon: '🚀',
    category: 'skill',
  },
  {
    id: 'daily_player',
    title: 'Daily Challenger',
    description: 'Submit a verified score in a Daily Challenge',
    icon: '📅',
    category: 'daily',
  },
  {
    id: 'social_challenger',
    title: 'Rivalry Spark',
    description: 'Create and copy a friend challenge link',
    icon: '⚔️',
    category: 'social',
  },
];

const ACHIEVEMENTS_STORAGE_KEY = 'arcade_pulse_unlocked_achievements';
const TOTAL_GAMES_PLAYED_KEY = 'arcade_pulse_total_plays';

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

export function getUnlockedAchievements(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function unlockAchievement(achievementId: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  const current = getUnlockedAchievements();
  if (current.includes(achievementId)) return false;

  current.push(achievementId);
  storage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(current));
  return true;
}

export function incrementTotalGamesPlayed(): number {
  const storage = getStorage();
  if (!storage) return 0;
  const current = parseInt(storage.getItem(TOTAL_GAMES_PLAYED_KEY) || '0', 10);
  const next = current + 1;
  storage.setItem(TOTAL_GAMES_PLAYED_KEY, String(next));

  // Check milestone achievements
  if (next >= 1) unlockAchievement('first_game');
  if (next >= 5) unlockAchievement('five_games');
  if (next >= 20) unlockAchievement('twenty_games');

  return next;
}

export function getTotalGamesPlayed(): number {
  const storage = getStorage();
  if (!storage) return 0;
  return parseInt(storage.getItem(TOTAL_GAMES_PLAYED_KEY) || '0', 10);
}
