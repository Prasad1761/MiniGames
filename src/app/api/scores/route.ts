import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const isDaily = searchParams.get('isDaily') === 'true';
    const dailyDate = searchParams.get('dailyDate');

    if (!gameId) {
      return NextResponse.json({ error: 'gameId required' }, { status: 400 });
    }

    const lowerIsBetter = gameId === 'reaction-test';

    const whereClause: any = { gameId };
    if (isDaily && dailyDate) {
      whereClause.isDaily = true;
      whereClause.dailyDate = dailyDate;
    }

    const scores = await prisma.score.findMany({
      where: whereClause,
      take: 25,
      orderBy: {
        score: lowerIsBetter ? 'asc' : 'desc',
      },
      include: {
        player: {
          select: {
            username: true,
            id: true,
          },
        },
      },
    });

    const formatted = scores.map((s, index) => ({
      rank: index + 1,
      id: s.id,
      score: s.score,
      username: s.player.username,
      createdAt: s.createdAt,
      meta: s.meta ? JSON.parse(s.meta) : null,
    }));

    return NextResponse.json({ scores: formatted });
  } catch (err: any) {
    console.error('Scores GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, score, anonymousId, username, meta, isDaily, dailyDate } = body;

    if (!gameId || typeof score !== 'number' || !anonymousId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // --- Anti-Cheat Validation Bounds ---
    if (gameId === 'reaction-test' && (score < 75 || score > 15000)) {
      return NextResponse.json({ error: 'Invalid reaction time' }, { status: 400 });
    }
    if (gameId === 'perfect-stack' && (score < 0 || score > 500)) {
      return NextResponse.json({ error: 'Invalid stack score' }, { status: 400 });
    }
    if (gameId === 'gravity-flip' && (score < 0 || score > 100000)) {
      return NextResponse.json({ error: 'Invalid distance score' }, { status: 400 });
    }

    // Upsert player profile
    const player = await prisma.player.upsert({
      where: { anonymousId },
      update: {
        username: username || 'ArcadePlayer',
      },
      create: {
        anonymousId,
        username: username || 'ArcadePlayer',
      },
    });

    // Record score
    const newScore = await prisma.score.create({
      data: {
        gameId,
        score,
        meta: meta ? JSON.stringify(meta) : null,
        playerId: player.id,
        isDaily: Boolean(isDaily),
        dailyDate: dailyDate || null,
      },
    });

    // Calculate player's current rank
    const lowerIsBetter = gameId === 'reaction-test';
    const higherBetterCount = await prisma.score.count({
      where: {
        gameId,
        ...(isDaily && dailyDate ? { isDaily: true, dailyDate } : {}),
        score: lowerIsBetter ? { lt: score } : { gt: score },
      },
    });

    const rank = higherBetterCount + 1;

    return NextResponse.json({
      success: true,
      scoreId: newScore.id,
      rank,
      player: {
        id: player.id,
        username: player.username,
      },
    });
  } catch (err: any) {
    console.error('Scores POST error:', err);
    return NextResponse.json({ error: 'Failed to record score' }, { status: 500 });
  }
}
