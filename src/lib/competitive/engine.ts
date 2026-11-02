// Competitive Engine – core utilities for rankings, achievements, and tournaments
// Uses Prisma client defined in src/lib/db (already set up)

import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// Leaderboard utilities
// ---------------------------------------------------------------------------
/**
 * Returns the top N scores for a given game. Optionally filter by daily leaderboard.
 */
export async function getLeaderboard(
  gameId: string,
  limit: number = 50,
  opts: { isDaily?: boolean; dailyDate?: string } = {}
) {
  const where: any = { gameId };
  if (opts.isDaily) {
    where.isDaily = true;
    if (opts.dailyDate) where.dailyDate = opts.dailyDate;
  }
  const scores = await prisma.score.findMany({
    where,
    orderBy: { score: 'desc' },
    take: limit,
    include: { player: { select: { username: true, id: true } } },
  });
  return scores;
}

/**
 * Records a new score. The caller should have already validated the session signature.
 */
export async function recordScore(params: {
  gameId: string;
  score: number;
  durationMs?: number;
  playerId: string;
  runSessionId?: string;
  isDaily?: boolean;
  dailyDate?: string;
  meta?: any;
}) {
  const { gameId, score, durationMs, playerId, runSessionId, isDaily, dailyDate, meta } = params;
  const newScore = await prisma.score.create({
    data: {
      gameId,
      score,
      durationMs: typeof durationMs === 'number' ? Math.floor(durationMs) : null,
      playerId,
      runSessionId: runSessionId ?? null,
      isDaily: Boolean(isDaily),
      dailyDate: isDaily && dailyDate ? dailyDate : null,
      meta: meta ? JSON.stringify(meta) : null,
    },
  });
  return newScore;
}

// ---------------------------------------------------------------------------
// Achievements utilities
// ---------------------------------------------------------------------------
/**
 * Simple achievement definition – in a real system this would be stored in DB.
 */
export const ACHIEVEMENTS = [
  { id: 'first-win', title: 'First Win', description: 'Record your first winning score.' },
  { id: 'high-score-1000', title: 'Score 1000+', description: 'Achieve a score of 1000 or more.' },
  // Add more as needed
];

/**
 * Records an achievement for a player. Idempotent – creates only if not existing.
 */
export async function recordAchievement(playerId: string, achievementId: string) {
  // For simplicity we store achievements in a dedicated table (to be added via migration).
  // Here we just ensure the achievement exists in the static list.
  const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!ach) throw new Error('Unknown achievement');

  // Upsert pattern – ensure one record per player/achievement.
  await prisma.$executeRaw`
    INSERT INTO "Achievement" ("playerId", "achievementId")
    VALUES (${playerId}, ${achievementId})
    ON CONFLICT ("playerId", "achievementId") DO NOTHING`;

  return { playerId, achievementId: ach.id, title: ach.title };
}

/**
 * Retrieves a player's earned achievements.
 */
export async function getPlayerAchievements(playerId: string) {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT a."achievementId", a2.title, a2.description
    FROM "Achievement" a
    JOIN (VALUES ${ACHIEVEMENTS.map((a) => `(${a.id}, '${a.title}', '${a.description}')`).join(', ')})
      AS a2("achievementId", title, description) ON a."achievementId" = a2."achievementId"
    WHERE a."playerId" = ${playerId}`;
  return rows;
}

// ---------------------------------------------------------------------------
// Tournament utilities (basic scaffold)
// ---------------------------------------------------------------------------
export async function createTournament(params: { name: string; gameId: string; startAt: Date; endAt: Date }) {
  const { name, gameId, startAt, endAt } = params;
  const tournament = await prisma.tournament.create({
    data: { name, gameId, startAt, endAt },
  });
  return tournament;
}

export async function listTournaments() {
  return prisma.tournament.findMany({ orderBy: { startAt: 'desc' } });
}

// ---------------------------------------------------------------------------
// Export a unified API object for convenience
// ---------------------------------------------------------------------------
export const CompetitiveEngine = {
  getLeaderboard,
  recordScore,
  recordAchievement,
  getPlayerAchievements,
  createTournament,
  listTournaments,
};
