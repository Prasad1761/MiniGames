import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/security/anti-cheat';
import { signSessionId } from '@/lib/security/crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { gameId, anonymousId, seed } = await req.json();

    if (!gameId || !anonymousId) {
      return NextResponse.json({ error: 'Missing gameId or anonymousId' }, { status: 400 });
    }

    const rateCheck = checkRateLimit(`run_${anonymousId}_${ip}`, 45, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Ensure player exists
    const player = await prisma.player.upsert({
      where: { anonymousId },
      update: {},
      create: { anonymousId, username: 'ArcadePlayer' },
    });

    const runSeed = typeof seed === 'number' ? seed : Math.floor(Math.random() * 100000);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min run window

    const run = await prisma.runSession.create({
      data: {
        gameId,
        playerId: player.id,
        seed: runSeed,
        expiresAt,
      },
    });

    const signature = signSessionId(run.id);

    return NextResponse.json({
      runSessionId: run.id,
      signature,
      seed: run.seed,
      startedAt: run.startedAt,
    });
  } catch (err: any) {
    console.error('Run session start error:', err);
    return NextResponse.json({ error: 'Failed to start run' }, { status: 500 });
  }
}
