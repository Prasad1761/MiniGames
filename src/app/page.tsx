'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Play,
  Trophy,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  Calendar,
  Share2,
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games/registry';
import { getHighScores, getPlayerName } from '@/lib/player';

export default function HomePage() {
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [username, setUsername] = useState('ArcadePlayer');
  const [dailyCountdown, setDailyCountdown] = useState({ hours: 14, minutes: 22 });

  useEffect(() => {
    setHighScores(getHighScores());
    setUsername(getPlayerName());

    fetch('/api/daily')
      .then((res) => res.json())
      .then((data) => {
        if (data.countdown) setDailyCountdown(data.countdown);
      })
      .catch(() => {});
  }, []);

  const featuredGames = GAMES_CATALOG.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-10 sm:space-y-14">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131825] via-[#0E121B] to-[#080A10] border border-cyan-500/20 p-6 sm:p-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black tracking-wider uppercase mb-4">
            <Zap className="w-3.5 h-3.5 fill-cyan-400" />
            Zero Installs • Instant Dopamine
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight font-display">
            PLAY IN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300">3 SECONDS</span>.
            <br />
            BEAT YOUR FRIENDS.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-400 font-medium leading-relaxed">
            Fast, juicy, 10–60 second mobile-first browser mini-games. No sign-ups required.
            Jump in, set a score, and share your challenge link in one tap.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/games/perfect-stack"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110 text-black font-black text-sm tracking-wider uppercase shadow-xl shadow-cyan-500/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-black" />
              Play Perfect Stack Now
            </Link>

            <Link
              href="/daily"
              className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-sm tracking-wide flex items-center gap-2 transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4 text-pink-400" />
              Daily Challenge
            </Link>
          </div>
        </div>
      </section>

      {/* Daily Challenge Spotlight */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-[#121622] border border-pink-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white flex-shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-pink-400">
                Synchronized Globally
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold">
                SAME SEED
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Today's Challenge: Reaction Test & Gravity Flip
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Resets in {dailyCountdown.hours}h {dailyCountdown.minutes}m • Everyone plays with the exact same physics seed!
            </p>
          </div>
        </div>

        <Link
          href="/daily"
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          Compete Today
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Featured 3 Playable Games (Wave 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              Trending Mini-Games
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Engineered for ultra-low latency, 60 FPS mobile touch precision.
            </p>
          </div>
          <Link
            href="/games"
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
          >
            View all 10 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredGames.map((g) => {
            const pb = highScores[g.id];
            return (
              <div
                key={g.id}
                className="group relative rounded-3xl bg-[#121622] border border-white/10 hover:border-cyan-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-cyan-500/10 overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl transition-opacity group-hover:opacity-25"
                  style={{ backgroundColor: g.accentColor }}
                />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-black font-sans"
                      style={{ backgroundColor: g.accentColor }}
                    >
                      {g.badge}
                    </span>
                    {pb !== undefined && (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        PB: {pb} {g.scoreUnit}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {g.tagline}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 10-45s round
                  </span>

                  <Link
                    href={`/games/${g.id}`}
                    className="px-5 py-2.5 rounded-xl bg-white/10 group-hover:bg-cyan-500 text-white group-hover:text-black font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5"
                  >
                    Play <Play className="w-3 h-3 fill-current" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* The Complete 10 Games Catalog */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Arcade Directory (10 Mini-Games)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Original arcade challenges across Reflex, Precision, Speed, and Puzzles.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {GAMES_CATALOG.map((g, idx) => {
            const pb = highScores[g.id];
            const isPlayable = ['perfect-stack', 'reaction-test', 'gravity-flip'].includes(g.id);

            return (
              <Link
                key={g.id}
                href={isPlayable ? `/games/${g.id}` : `/games/${g.id}`}
                className="group p-4 rounded-2xl bg-[#0F131D] border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      #{idx + 1} • {g.category}
                    </span>
                    {isPlayable && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Ready to play" />
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                    {g.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                    {g.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-bold">
                  {pb !== undefined ? (
                    <span className="text-amber-400">PB: {pb}</span>
                  ) : (
                    <span className="text-gray-500">{g.scoreUnit}</span>
                  )}
                  <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
