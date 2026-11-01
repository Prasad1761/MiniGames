// Player Profile & Progress Manager
import { PlayerProfile } from './types';

const PLAYER_ID_KEY = 'arcade_pulse_player_id';
const PLAYER_NAME_KEY = 'arcade_pulse_username';
const HIGH_SCORES_KEY = 'arcade_pulse_highscores';

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'server_player';
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = 'player_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getPlayerName(): string {
  if (typeof window === 'undefined') return 'ArcadeLegend';
  let name = localStorage.getItem(PLAYER_NAME_KEY);
  if (!name) {
    const adjectives = ['Neon', 'Hyper', 'Turbo', 'Cyber', 'Sonic', 'Vortex', 'Pixel', 'Pulse'];
    const nouns = ['Pilot', 'Ninja', 'Racer', 'Striker', 'Ghost', 'Knight', 'Fox', 'Spark'];
    name = adjectives[Math.floor(Math.random() * adjectives.length)] + 
           nouns[Math.floor(Math.random() * nouns.length)] + 
           Math.floor(Math.random() * 90 + 10);
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }
  return name;
}

export function setPlayerName(name: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PLAYER_NAME_KEY, name.trim().slice(0, 16));
  }
}

export function getPersonalBest(gameId: string, lowerIsBetter: boolean = false): number | null {
  if (typeof window === 'undefined') return null;
  const scores = getHighScores();
  if (scores[gameId] !== undefined) {
    return scores[gameId];
  }
  return null;
}

export function recordScore(gameId: string, score: number, lowerIsBetter: boolean = false): { isNewRecord: boolean; previousBest: number | null } {
  if (typeof window === 'undefined') return { isNewRecord: false, previousBest: null };
  const scores = getHighScores();
  const current = scores[gameId];

  let isNewRecord = false;
  if (current === undefined) {
    isNewRecord = true;
  } else if (lowerIsBetter ? score < current : score > current) {
    isNewRecord = true;
  }

  if (isNewRecord) {
    scores[gameId] = score;
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
  }

  return {
    isNewRecord,
    previousBest: current ?? null,
  };
}

export function getHighScores(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(HIGH_SCORES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'success':
        navigator.vibrate([15, 30, 20]);
        break;
      case 'error':
        navigator.vibrate([40, 40, 40]);
        break;
    }
  } catch {
    // Ignore unsupported
  }
}
