'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getGameById, createGameInstance } from '@/lib/games/registry';
import GameShell from '@/components/GameShell';

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  const game = getGameById(gameId);

  const isDaily = searchParams.get('mode') === 'daily';
  const dailyDate = searchParams.get('date') || undefined;
  const seedParam = searchParams.get('seed');
  const customSeed = seedParam ? parseInt(seedParam, 10) : undefined;

  if (!game) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-black text-white font-display">Game Not Found</h2>
        <p className="text-sm text-gray-400 mt-2">The requested mini-game does not exist.</p>
        <Link
          href="/"
          className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs"
        >
          Return to Arcade
        </Link>
      </div>
    );
  }

  const instance = createGameInstance(gameId);

  if (!instance) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-[#121622] border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mt-3">{game.title}</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{game.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <GameShell
        game={game}
        instanceFactory={() => createGameInstance(gameId)}
        isDaily={isDaily}
        dailyDate={dailyDate}
        seed={customSeed}
      />
    </div>
  );
}
