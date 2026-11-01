'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Clock, Trophy, Flame } from 'lucide-react';
import { getGameById, createGameInstance, GAMES_CATALOG } from '@/lib/games/registry';
import GameShell from '@/components/GameShell';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const game = getGameById(gameId);

  if (!game) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-black text-white">Game Not Found</h2>
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

  // If game is in queue / coming in next wave
  if (!instance) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-[#121622] border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300">
            Coming In Wave 2
          </span>
          <h2 className="text-2xl font-black text-white mt-3">{game.title}</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{game.description}</p>

          <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
            <p className="text-xs font-bold text-gray-300">Playable Now:</p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/games/perfect-stack"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-cyan-400 border border-white/5"
              >
                Perfect Stack
              </Link>
              <Link
                href="/games/reaction-test"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-emerald-400 border border-white/5"
              >
                Reaction Test
              </Link>
              <Link
                href="/games/gravity-flip"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-pink-400 border border-white/5"
              >
                Gravity Flip
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <GameShell
        game={game}
        instanceFactory={() => createGameInstance(gameId)}
      />
    </div>
  );
}
