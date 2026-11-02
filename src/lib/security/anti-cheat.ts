// ArcadePulse V2 Security & Anti-Cheat Engine

export interface GameScoreBound {
  min: number;
  max: number;
  lowerIsBetter?: boolean;
  minDurationMsPerUnit?: number;
}

export const GAME_BOUNDS: Record<string, GameScoreBound> = {
  'perfect-stack': { min: 0, max: 500, minDurationMsPerUnit: 300 },
  'reaction-test': { min: 75, max: 10000, lowerIsBetter: true },
  'gravity-flip': { min: 0, max: 50000, minDurationMsPerUnit: 50 },
  'color-panic': { min: 0, max: 200, minDurationMsPerUnit: 400 },
  'one-more-jump': { min: 0, max: 300, minDurationMsPerUnit: 500 },
  'dont-tap-red': { min: 0, max: 500, minDurationMsPerUnit: 150 },
  'memory-flash': { min: 0, max: 60, minDurationMsPerUnit: 1000 },
  'perfect-timing': { min: 0, max: 200, minDurationMsPerUnit: 350 },
  'merge-rush': { min: 0, max: 100000, minDurationMsPerUnit: 200 },
  'impossible-maze': { min: 1, max: 50, minDurationMsPerUnit: 2000 },
  'retro-runner': { min: 0, max: 999999, minDurationMsPerUnit: 100 },  // Added missing bound
  'asteroid-blast': { min: 0, max: 999999, minDurationMsPerUnit: 200 },  // Added missing bound
  'puzzle-crash': { min: 0, max: 999999, minDurationMsPerUnit: 300 },  // Added missing bound
};

/**
 * Validates whether a score is mathematically possible within game parameters.
 */
export function validateScoreBounds(
  gameId: string,
  score: number,
  durationMs?: number
): { valid: boolean; reason?: string } {
  const bound = GAME_BOUNDS[gameId];
  if (!bound) {
    return { valid: false, reason: `Unknown game identifier: ${gameId}` };
  }

  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return { valid: false, reason: 'Score must be a finite number' };
  }

  if (score < bound.min || score > bound.max) {
    return {
      valid: false,
      reason: `Score ${score} out of plausible bounds [${bound.min}, ${bound.max}] for ${gameId}`,
    };
  }

  // Duration feasibility check if duration is provided
  if (durationMs !== undefined && bound.minDurationMsPerUnit) {
    const minPlausibleDuration = score * bound.minDurationMsPerUnit * 0.4; // 60% tolerance buffer
    if (durationMs < minPlausibleDuration) {
      return {
        valid: false,
        reason: `Implausible duration: ${durationMs}ms for score of ${score}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes and formats player username, stripping dangerous characters.
 */
export function sanitizeUsername(rawName?: string): string {
  if (!rawName || typeof rawName !== 'string') return 'ArcadePlayer';
  // Strip HTML and script tags
  let cleaned = rawName.replace(/<[^>]*>?/gm, '');
  // Keep only alphanumeric, hyphens, spaces, and underscores
  cleaned = cleaned.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
  if (cleaned.length < 2) return 'ArcadePlayer';
  return cleaned.slice(0, 16);
}

// In-Memory Sliding Window Rate Limiter
interface RateBucket {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateBucket>();

/**
 * Basic in-memory rate limiter for serverless/Node API calls.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let bucket = rateLimitStore.get(identifier);

  if (!bucket) {
    bucket = { timestamps: [] };
    rateLimitStore.set(identifier, bucket);
  }

  // Filter timestamps outside current window
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - bucket.timestamps.length,
  };
}
