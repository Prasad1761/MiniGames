import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  validateScoreBounds,
  sanitizeUsername,
  checkRateLimit,
} from '@/lib/security/anti-cheat';
import { GAMES_CATALOG } from '@/lib/games/registry';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get('gameId');
    const isDaily = searchParams.get('isDaily') === 'true';
    const dailyDate = searchParams.get('dailyDate');

    if (!gameId) {
      return NextResponse.json({ error: 'gameId required' }, { status: 400 });
    }

    const game = GAMES_CATALOG.find((g) => g.id === gameId);
    const lowerIsBetter = game?.lowerIsBetter ?? (gameId === 'reaction-test');

    const whereClause: any = { gameId };
    if (isDaily && dailyDate) {
      whereClause.isDaily = true;
      whereClause.dailyDate = dailyDate;
    }

    const scores = await prisma.score.findMany({
      where: whereClause,
      take: 50,
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
      isDaily: s.isDaily,
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
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await req.json();
    const {
      gameId,
      score,
      anonymousId,
      username,
      meta,
      isDaily,
      dailyDate,
      durationMs,
      runSessionId,
    } = body;

    if (!gameId || typeof score !== 'number' || !anonymousId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Rate Limiting (max 30 submissions per minute per client)
    const rateCheck = checkRateLimit(`score_${anonymousId}_${ip}`, 30, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before submitting again.' },
        { status: 429 }
      );
    }

    // Anti-Cheat: Validate Score Bounds & Feasibility
    const validation = validateScoreBounds(gameId, score, durationMs);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // Sanitize Gamer Tag
    const cleanUsername = sanitizeUsername(username);

    // Upsert player profile
    const player = await prisma.player.upsert({
      where: { anonymousId },
      update: {
        username: cleanUsername,
      },
      create: {
        anonymousId,
        username: cleanUsername,
      },
    });

    // Create Score record
    const newScore = await prisma.score.create({
      data: {
        gameId,
        score,
        durationMs: typeof durationMs === 'number' ? Math.floor(durationMs) : null,
        meta: meta ? JSON.stringify(meta) : null,
        playerId: player.id,
        runSessionId: runSessionId || null,
        isDaily: Boolean(isDaily),
        dailyDate: isDaily && dailyDate ? dailyDate : null,
      },
    });

    // Calculate rank
    const game = GAMES_CATALOG.find((g) => g.id === gameId);
    const lowerIsBetter = game?.lowerIsBetter ?? (gameId === 'reaction-test');

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
      isDaily: Boolean(isDaily),
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
