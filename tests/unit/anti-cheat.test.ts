import { describe, it, expect } from 'vitest';
import {
  validateScoreBounds,
  sanitizeUsername,
  checkRateLimit,
  GAME_BOUNDS,
} from '@/lib/security/anti-cheat';

describe('Anti-Cheat: validateScoreBounds', () => {
  it('allows valid scores within plausible bounds', () => {
    expect(validateScoreBounds('perfect-stack', 25).valid).toBe(true);
    expect(validateScoreBounds('reaction-test', 210).valid).toBe(true);
    expect(validateScoreBounds('gravity-flip', 850).valid).toBe(true);
    expect(validateScoreBounds('merge-rush', 4096).valid).toBe(true);
    expect(validateScoreBounds('impossible-maze', 7).valid).toBe(true);
  });

  it('rejects scores exceeding max bounds', () => {
    const res = validateScoreBounds('perfect-stack', 999999);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('out of plausible bounds');
  });

  it('rejects impossible reaction times (e.g. sub-75ms superhuman reflex)', () => {
    const res = validateScoreBounds('reaction-test', 30);
    expect(res.valid).toBe(false);
  });

  it('rejects non-numeric and NaN values', () => {
    expect(validateScoreBounds('perfect-stack', NaN).valid).toBe(false);
    expect(validateScoreBounds('perfect-stack', Infinity).valid).toBe(false);
  });

  it('rejects unknown game IDs', () => {
    const res = validateScoreBounds('fake-game-id', 50);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('Unknown game identifier');
  });

  it('validates duration feasibility when provided', () => {
    // 50 blocks in 100ms is physically impossible
    const res = validateScoreBounds('perfect-stack', 50, 100);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('Implausible duration');

    // 50 blocks in 30,000ms is reasonable
    const validRes = validateScoreBounds('perfect-stack', 50, 30000);
    expect(validRes.valid).toBe(true);
  });
});

describe('Anti-Cheat: sanitizeUsername', () => {
  it('strips script and html tags', () => {
    const sanitized = sanitizeUsername('<script>alert("xss")</script>Player');
    expect(sanitized).toBe('alertxssPlayer');
  });

  it('falls back to ArcadePlayer on empty or offensive symbols', () => {
    expect(sanitizeUsername('')).toBe('ArcadePlayer');
    expect(sanitizeUsername('   ')).toBe('ArcadePlayer');
    expect(sanitizeUsername('$$$###')).toBe('ArcadePlayer');
  });

  it('limits usernames to 16 characters', () => {
    const longName = 'SuperUltraMegaLongGamerName123456';
    const sanitized = sanitizeUsername(longName);
    expect(sanitized.length).toBeLessThanOrEqual(16);
    expect(sanitized).toBe('SuperUltraMegaLo');
  });

  it('preserves valid alphanumeric with underscores and hyphens', () => {
    expect(sanitizeUsername('Cyber_Knight-99')).toBe('Cyber_Knight-99');
  });
});

describe('Anti-Cheat: checkRateLimit', () => {
  it('allows requests within threshold and blocks excess', () => {
    const testId = `user_${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testId, 5, 10000);
      expect(res.allowed).toBe(true);
    }
    // 6th request should be blocked
    const blockedRes = checkRateLimit(testId, 5, 10000);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
  });
});
