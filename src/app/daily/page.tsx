'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Trophy, Play, Clock, Sparkles, Medal } from 'lucide-react';
import { GameMetadata } from '@/lib/types';
import { GAMES_CATALOG } from '@/lib/games/registry';

interface DailyData {
  date: string;
  seed: number;
  featuredGame: GameMetadata;
  countdown: {
    hours: number;
    minutes: number;
  };
  leaderboard: Array<{
    rank: number;
    username: string;
    score: number;
  }>;
}

export default function DailyPage() {
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const game = data.featuredGame || GAMES_CATALOG[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-black uppercase tracking-wider mb-3">
          <Calendar className="w-3.5 h-3.5" />
          Synchronized Global Daily Challenge
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-display">
          TODAY'S DAILY RIVALRY
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Every player worldwide encounters the exact same random seed. One board, one leaderboard.
        </p>

        {/* Countdown */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
          <Clock className="w-4 h-4 text-pink-400" />
          <span>Resets in: <strong className="text-white font-mono">{data.countdown.hours}h {data.countdown.minutes}m</strong></span>
        </div>
      </div>

      {/* Featured Game Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#181222] via-[#101420] to-[#0A0D14] border border-pink-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-pink-500 text-black">
            FEATURED GAME TODAY
          </span>
          <h2 className="text-3xl font-black text-white mt-2 font-display tracking-wide">
            {game.title}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-md">
            {game.description}
          </p>
        </div>

        <Link
          href={`/games/${game.id}`}
          className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-amber-400 hover:brightness-110 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-black" />
          Play Daily Run
        </Link>
      </div>

      {/* Today's Global Daily Rankings */}
      <div className="p-6 rounded-3xl bg-[#121622] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Today's Top 10 Daily Rankings
          </h3>
          <span className="text-xs text-gray-500 font-mono">Date: {data.date}</span>
        </div>

        {data.leaderboard.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No daily scores logged yet today! Be the first to claim Rank #1.
          </div>
        ) : (
          <div className="space-y-2">
            {data.leaderboard.map((item) => (
              <div
                key={item.rank}
                className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                      item.rank === 1
                        ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                        : item.rank === 2
                        ? 'bg-slate-300 text-black'
                        : item.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {item.rank}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.username}
                  </span>
                </div>

                <span className="text-sm font-black text-cyan-400 font-mono">
                  {item.score} {game.scoreUnit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
