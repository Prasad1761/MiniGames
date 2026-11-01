import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sanitizeUsername } from '@/lib/security/anti-cheat';
import { GAMES_CATALOG } from '@/lib/games/registry';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const anonymousId = searchParams.get('anonymousId');

    if (!anonymousId) {
      return NextResponse.json({ error: 'anonymousId required' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: { anonymousId },
      include: {
        scores: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!player) {
      return NextResponse.json({
        player: {
          anonymousId,
          username: 'ArcadePlayer',
          totalScores: 0,
          personalBests: {},
          recentScores: [],
        },
      });
    }

    // Compute personal best for each game
    const pbs: Record<string, number> = {};
    for (const game of GAMES_CATALOG) {
      const lowerIsBetter = game.lowerIsBetter ?? (game.id === 'reaction-test');
      const best = await prisma.score.findFirst({
        where: { playerId: player.id, gameId: game.id },
        orderBy: { score: lowerIsBetter ? 'asc' : 'desc' },
      });
      if (best) {
        pbs[game.id] = best.score;
      }
    }

    const totalScores = await prisma.score.count({
      where: { playerId: player.id },
    });

    return NextResponse.json({
      player: {
        id: player.id,
        anonymousId: player.anonymousId,
        username: player.username,
        createdAt: player.createdAt,
        totalScores,
        personalBests: pbs,
        recentScores: player.scores.map((s) => ({
          id: s.id,
          gameId: s.gameId,
          score: s.score,
          createdAt: s.createdAt,
          isDaily: s.isDaily,
        })),
      },
    });
  } catch (err: any) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { anonymousId, username } = await req.json();

    if (!anonymousId || !username) {
      return NextResponse.json({ error: 'anonymousId and username required' }, { status: 400 });
    }

    const cleanUsername = sanitizeUsername(username);

    const updated = await prisma.player.upsert({
      where: { anonymousId },
      update: { username: cleanUsername },
      create: { anonymousId, username: cleanUsername },
    });

    return NextResponse.json({ success: true, username: updated.username });
  } catch (err: any) {
    console.error('Profile PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
