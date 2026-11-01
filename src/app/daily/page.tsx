'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Trophy, Play, Clock, Sparkles, Medal, ShieldCheck, Flame, Hash } from 'lucide-react';
import { GameMetadata } from '@/lib/types';
import { GAMES_CATALOG } from '@/lib/games/registry';
import { getPlayerName } from '@/lib/player';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  createdAt?: string;
}

interface DailyData {
  date: string;
  seed: number;
  featuredGame: GameMetadata;
  countdown: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  leaderboard: LeaderboardEntry[];
}

export default function DailyPage() {
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  useEffect(() => {
    setCurrentUsername(getPlayerName());

    fetch('/api/daily')
      .then((res) => res.json())
      .then((d: DailyData) => {
        setData(d);
        const totalSec = (d.countdown.hours * 3600) + (d.countdown.minutes * 60) + (d.countdown.seconds || 0);
        setSecondsRemaining(totalSec);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  // Live ticking countdown
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const formatCountdown = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-gray-400">Loading daily rivalry state...</span>
      </div>
    );
  }

  const game = data.featuredGame || GAMES_CATALOG[0];
  const playUrl = `/games/${game.id}?mode=daily&date=${encodeURIComponent(data.date)}&seed=${data.seed}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-black uppercase tracking-wider mb-3">
          <Calendar className="w-3.5 h-3.5" />
          Synchronized Global Daily Challenge
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
          TODAY'S DAILY RIVALRY
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Every player worldwide encounters the exact same random seed. One board, zero excuses, pure skill.
        </p>

        {/* Live Countdown & Seed Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
            <Clock className="w-4 h-4 text-pink-400 animate-pulse" />
            <span>Resets in: <strong className="text-white font-mono">{formatCountdown(secondsRemaining)}</strong></span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-300">
            <Hash className="w-3.5 h-3.5" />
            <span>Seed: <strong>{data.seed}</strong></span>
          </div>
        </div>
      </div>

      {/* Featured Game Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#181222] via-[#101420] to-[#0A0D14] border border-pink-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-pink-500 text-black">
              FEATURED GAME TODAY
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {game.category}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display tracking-wide">
            {game.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-md leading-relaxed">
            {game.description}
          </p>
          <div className="pt-2 text-xs font-medium text-pink-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All participants compete under Seed #{data.seed}</span>
          </div>
        </div>

        <Link
          href={playUrl}
          className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-amber-400 hover:brightness-110 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 z-10 shrink-0"
        >
          <Play className="w-4 h-4 fill-black" />
          Play Daily Run
        </Link>
      </div>

      {/* Today's Global Daily Rankings */}
      <div className="p-6 rounded-3xl bg-[#121622] border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Today's Global Leaderboard
          </h3>
          <span className="text-xs text-gray-400 font-mono">Date: {data.date} (UTC)</span>
        </div>

        {data.leaderboard.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Flame className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-sm font-bold text-gray-400">No daily records posted yet today.</p>
            <p className="text-xs text-gray-500">Be the first player in the world to claim the #1 spot!</p>
            <Link
              href={playUrl}
              className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 font-bold text-xs transition-colors"
            >
              Set First Daily Score
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.leaderboard.map((entry) => {
              const isCurrentUser = entry.username.toLowerCase() === currentUsername.toLowerCase();
              return (
                <div
                  key={`${entry.rank}-${entry.username}`}
                  className={`py-3 px-3 rounded-xl flex items-center justify-between transition-colors ${
                    isCurrentUser ? 'bg-pink-500/15 border border-pink-500/30' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 text-center font-black text-sm">
                      {entry.rank === 1 && <span className="text-amber-400 font-bold text-base">🥇</span>}
                      {entry.rank === 2 && <span className="text-gray-300 font-bold text-base">🥈</span>}
                      {entry.rank === 3 && <span className="text-amber-600 font-bold text-base">🥉</span>}
                      {entry.rank > 3 && <span className="text-gray-500">#{entry.rank}</span>}
                    </span>
                    <div>
                      <span className={`text-sm font-extrabold ${isCurrentUser ? 'text-pink-300' : 'text-white'}`}>
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-[10px] font-black uppercase bg-pink-500 text-black px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-black text-cyan-400">
                      {entry.score}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-1 font-semibold">
                      {game.scoreUnit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
