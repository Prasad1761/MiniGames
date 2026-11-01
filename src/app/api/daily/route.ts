import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GAMES_CATALOG } from '@/lib/games/registry';
import { getDailySeed } from '@/lib/prng';

export async function GET() {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const seed = getDailySeed();

    // Deterministically rotate across all 10 games based on UTC day
    const dayNumber = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    const featuredGame = GAMES_CATALOG[dayNumber % GAMES_CATALOG.length];
    const featuredGameId = featuredGame.id;

    // Calculate time remaining until midnight UTC
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msRemaining = tomorrow.getTime() - now.getTime();
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

    // Get today's top 20 daily scores for this game
    const lowerIsBetter = featuredGame.lowerIsBetter ?? (featuredGameId === 'reaction-test');
    const topDaily = await prisma.score.findMany({
      where: {
        gameId: featuredGameId,
        isDaily: true,
        dailyDate: dateStr,
      },
      take: 20,
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
