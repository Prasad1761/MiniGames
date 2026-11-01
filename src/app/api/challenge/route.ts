import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  sanitizeUsername,
  validateScoreBounds,
  checkRateLimit,
} from '@/lib/security/anti-cheat';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { gameId, targetScore, anonymousId, username } = await req.json();

    if (!gameId || typeof targetScore !== 'number' || !anonymousId) {
      return NextResponse.json({ error: 'Missing challenge info' }, { status: 400 });
    }

    // Rate limit challenge creation
    const rateCheck = checkRateLimit(`challenge_${anonymousId}_${ip}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many challenge creations. Please slow down.' }, { status: 429 });
    }

    // Validate score bounds
    const validation = validateScoreBounds(gameId, targetScore);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Target score is not mathematically valid' }, { status: 400 });
    }

    const cleanUsername = sanitizeUsername(username);

    const player = await prisma.player.upsert({
      where: { anonymousId },
      update: { username: cleanUsername },
      create: { anonymousId, username: cleanUsername },
    });

    // Default 7-day expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const challenge = await prisma.challenge.create({
      data: {
        gameId,
        targetScore,
        creatorId: player.id,
        seed: Math.floor(Math.random() * 100000),
        expiresAt,
      },
    });

    return NextResponse.json({
      challengeId: challenge.id,
      url: `/challenge/${challenge.id}`,
      expiresAt: challenge.expiresAt,
    });
  } catch (err: any) {
    console.error('Challenge POST error:', err);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Challenge id required' }, { status: 400 });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check expiration
    if (challenge.expiresAt && new Date() > challenge.expiresAt) {
      return NextResponse.json(
        { error: 'This challenge has expired', expired: true, challenge },
        { status: 410 }
      );
    }

    return NextResponse.json({ challenge });
  } catch (err: any) {
    console.error('Challenge GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}
