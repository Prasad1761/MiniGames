'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Swords, Play, Sparkles, AlertCircle, Clock, Copy, Check, ArrowRight } from 'lucide-react';
import { getGameById, createGameInstance } from '@/lib/games/registry';
import GameShell from '@/components/GameShell';

interface ChallengeData {
  id: string;
  gameId: string;
  targetScore: number;
  seed: number;
  expiresAt?: string;
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
  const [isExpired, setIsExpired] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/challenge?id=${challengeId}`)
      .then((res) => {
        if (res.status === 410) {
          setIsExpired(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) {
          setError(data.error);
        } else {
          setChallenge(data.challenge);
          if (data.challenge.expiresAt && new Date(data.challenge.expiresAt) < new Date()) {
            setIsExpired(true);
          }
        }
      })
      .catch((err) => setError('Failed to load challenge'))
      .finally(() => setLoading(false));
  }, [challengeId]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-gray-400">Loading challenge duel...</span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center animate-fade-in">
        <div className="p-8 rounded-3xl bg-[#121622] border border-amber-500/30 shadow-2xl space-y-4">
          <Clock className="w-14 h-14 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-black text-white font-display">Challenge Expired</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Friend challenge links are active for 7 days. This match has concluded, but you can jump in and issue a fresh challenge!
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {challenge && (
              <Link
                href={`/games/${challenge.gameId}`}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider"
              >
                Play This Game & Create New Challenge
              </Link>
            )}
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
            >
              Back to Arcade Lobby
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center animate-fade-in">
        <div className="p-8 rounded-3xl bg-[#121622] border border-white/10 shadow-2xl space-y-4">
          <AlertCircle className="w-14 h-14 text-rose-400 mx-auto" />
          <h2 className="text-2xl font-black text-white font-display">Challenge Not Found</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            This challenge link might be mistyped or no longer exists.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs uppercase tracking-wider"
          >
            Explore Arcade
          </Link>
        </div>
      </div>
    );
  }

  const game = getGameById(challenge.gameId);
  if (!game) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-[#121622] border border-white/10 text-white">
          Game metadata unavailable.
        </div>
      </div>
    );
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

  const isLowerBetter = game.lowerIsBetter ?? (game.id === 'reaction-test');

  return (
    <div className="max-w-md mx-auto py-10 px-4 select-none animate-fade-in">
      <div className="p-8 rounded-3xl bg-gradient-to-b from-[#151A24] to-[#0D1017] border-2 border-pink-500/40 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Challenge Swords Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/30 mb-5">
          <Swords className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Direct Rivalry Challenge
        </div>

        <h1 className="text-2xl font-black text-white mt-1">
          {challenge.creator.username.toUpperCase()}
        </h1>
        <p className="text-xs text-gray-400">has challenged you to beat them on</p>
        <h2 className="text-3xl font-black text-cyan-400 mt-1 font-display tracking-wide">
          {game.title}
        </h2>

        {/* Target Score Card */}
        <div className="my-6 p-6 rounded-2xl bg-black/40 border border-white/10 relative">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
            {isLowerBetter ? 'TARGET TIME TO BEAT (LOWER IS BETTER)' : 'TARGET SCORE TO BEAT'}
          </span>
          <span className="text-5xl font-black text-white font-display">
            {challenge.targetScore}
          </span>
          <span className="text-xs font-bold text-gray-400 block mt-1">
            {game.scoreUnit}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => setPlaying(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:brightness-110 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-black" />
            Accept Challenge & Play Now
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Link Copied to Clipboard!' : 'Share Challenge Link'}
          </button>
        </div>

        <p className="text-[11px] text-gray-500 mt-4">
          Runs under synchronized Seed #{challenge.seed}. Zero installs. Instant mobile play.
        </p>
      </div>
    </div>
  );
}
