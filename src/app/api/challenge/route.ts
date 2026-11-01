import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { gameId, targetScore, anonymousId, username } = await req.json();

    if (!gameId || typeof targetScore !== 'number' || !anonymousId) {
      return NextResponse.json({ error: 'Missing challenge info' }, { status: 400 });
    }

    const player = await prisma.player.upsert({
      where: { anonymousId },
      update: { username: username || 'ArcadePlayer' },
      create: { anonymousId, username: username || 'ArcadePlayer' },
    });

    const challenge = await prisma.challenge.create({
      data: {
        gameId,
        targetScore,
        creatorId: player.id,
        seed: Math.floor(Math.random() * 100000),
      },
    });

    return NextResponse.json({
      challengeId: challenge.id,
      url: `/challenge/${challenge.id}`,
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

    return NextResponse.json({ challenge });
  } catch (err: any) {
    console.error('Challenge GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}
