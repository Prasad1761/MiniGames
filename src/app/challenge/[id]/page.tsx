'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Swords, Play, Sparkles, AlertCircle } from 'lucide-react';
import { getGameById, createGameInstance } from '@/lib/games/registry';
import GameShell from '@/components/GameShell';

interface ChallengeData {
  id: string;
  gameId: string;
  targetScore: number;
  seed: number;
  creator: {
    username: string;
  };
}

export default function ChallengeLandingPage() {
  const params = useParams();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetch(`/api/challenge?id=${challengeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setChallenge(data.challenge);
        }
      })
      .catch((err) => setError('Failed to load challenge'))
      .finally(() => setLoading(false));
  }, [challengeId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-[#121622] border border-white/10 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-black text-white">Challenge Not Found</h2>
          <p className="text-xs text-gray-400 mt-2">
            This challenge link may have expired or is invalid.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs"
          >
            Explore Arcade
          </Link>
        </div>
      </div>
    );
  }

  const game = getGameById(challenge.gameId);
  if (!game) {
    return <div>Unknown game</div>;
  }

  // Once user clicks "Accept Challenge", start live game
  if (playing) {
    return (
      <GameShell
        game={game}
        instanceFactory={() => createGameInstance(game.id)}
        seed={challenge.seed}
        challengeTarget={challenge.targetScore}
        challengeCreator={challenge.creator.username}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 select-none">
      <div className="p-8 rounded-3xl bg-gradient-to-b from-[#151A24] to-[#0D1017] border-2 border-pink-500/40 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Challenge Swords Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/30 mb-5">
          <Swords className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Friend Challenge
        </div>

        <h1 className="text-2xl font-black text-white mt-1">
          {challenge.creator.username.toUpperCase()}
        </h1>
        <p className="text-sm text-gray-400">has challenged you on</p>
        <h2 className="text-3xl font-black text-cyan-400 mt-1 font-display tracking-wide">
          {game.title}
        </h2>

        {/* Target Score Card */}
        <div className="my-6 p-6 rounded-2xl bg-black/40 border border-white/10 relative">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
            TARGET SCORE TO BEAT
          </span>
          <span className="text-5xl font-black text-white font-display">
            {challenge.targetScore}
          </span>
          <span className="text-xs font-bold text-gray-400 block mt-1">
            {game.scoreUnit}
          </span>
        </div>

        {/* Accept Button */}
        <button
          onClick={() => setPlaying(true)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:brightness-110 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-black" />
          Accept Challenge & Play Now
        </button>

        <p className="text-[11px] text-gray-500 mt-4">
          No install or registration needed. Plays instantly in your browser.
        </p>
      </div>
    </div>
  );
}
