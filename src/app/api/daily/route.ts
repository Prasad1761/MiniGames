import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GAMES_CATALOG } from '@/lib/games/registry';
import { getDailySeed } from '@/lib/prng';

export async function GET() {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const seed = getDailySeed();

    // Deterministically pick today's featured game based on day
    const dayNumber = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const playableGames = ['perfect-stack', 'reaction-test', 'gravity-flip'];
    const featuredGameId = playableGames[dayNumber % playableGames.length];
    const featuredGame = GAMES_CATALOG.find((g) => g.id === featuredGameId);

    // Calculate time remaining until midnight UTC
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msRemaining = tomorrow.getTime() - now.getTime();
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

    // Get today's top 10 daily scores for this game
    const lowerIsBetter = featuredGameId === 'reaction-test';
    const topDaily = await prisma.score.findMany({
      where: {
        gameId: featuredGameId,
        isDaily: true,
        dailyDate: dateStr,
      },
      take: 10,
      orderBy: {
        score: lowerIsBetter ? 'asc' : 'desc',
      },
      include: {
        player: {
          select: { username: true },
        },
      },
    });

    return NextResponse.json({
      date: dateStr,
      seed,
      featuredGame,
      countdown: {
        hours: hoursRemaining,
        minutes: minutesRemaining,
      },
      leaderboard: topDaily.map((s, idx) => ({
        rank: idx + 1,
        username: s.player.username,
        score: s.score,
        createdAt: s.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('Daily API error:', err);
    return NextResponse.json({ error: 'Failed to fetch daily info' }, { status: 500 });
  }
}
